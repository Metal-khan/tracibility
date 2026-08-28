import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Sharing from 'expo-sharing';
// expo-file-system's SDK 54 API moved cacheDirectory/downloadAsync etc. to a
// new class-based API — importing from /legacy keeps the familiar API this
// screen already uses (download-then-share/save) working as-is.
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import WebView from 'react-native-webview';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
    ProductQRCode: { productId: number };
};

type ProductQRCodeRouteProp = RouteProp<RootStackParamList, 'ProductQRCode'>;

// Define expected data structure
interface ProductQRCodeData {
    qr_code_url: string; // Authenticated URL to the SVG (kept for reference; not used directly by this screen)
    qr_code_data_uri: string; // data:image/svg+xml;base64,... — everything needed to render/export, fetched once with auth
    qr_code_html: string; // Full HTML doc wrapping qr_code_data_uri, for the WebView
    barcode_text: string; // The unique text identifier
    message: string;
    product_id: number;
}

const ProductQRCodeScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<ProductQRCodeRouteProp>();
    const { productId } = route.params;

    const [qrCodeData, setQrCodeData] = useState<ProductQRCodeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQrCodeUrl = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const response = await api.get(`/products/${productId}/qrcode`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Assuming the backend returns { qr_code_url, barcode_text, product_id }
                setQrCodeData({
                    ...response.data,
                    product_id: productId,
                    barcode_text: response.data.barcode_text || `Product ID # ${productId}` // Fallback
                });
            } catch (err: any) {
                console.error("Failed to fetch barcode URL:", err.response?.data || err.message);
                setError(err.response?.data?.message || 'Failed to load QR code data.');
            } finally {
                setLoading(false);
            }
        };

        fetchQrCodeUrl();
    }, [productId]);

    // The SVG's own bytes, base64-decoded from qr_code_data_uri (already
    // fetched with the auth header on load) — writing them straight to a
    // local file avoids a second request to the authenticated qr-image
    // endpoint, which plain FileSystem.downloadAsync/WebView/Print can't
    // attach an Authorization header to reliably.
    const writeQrSvgToCache = async (filename: string): Promise<string> => {
        const dataUri = qrCodeData!.qr_code_data_uri;
        const base64Svg = dataUri.substring(dataUri.indexOf(',') + 1);
        const path = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(path, base64Svg, { encoding: FileSystem.EncodingType.Base64 });
        return path;
    };

    const handleDownload = async () => {
        if (!qrCodeData?.qr_code_data_uri) return;

        try {
            // Only request the 'photo' granular permission — the default
            // (no args) also requests 'audio', which Expo Go's fixed
            // Android build doesn't declare in its manifest, making the
            // whole request throw before the user even sees a prompt.
            const { granted } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
            if (!granted) {
                Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Allow photo access to save the QR code.', visibilityTime: 4000 });
                return;
            }
            const filename = `product_barcode_${productId}.svg`;

            const localUri = await writeQrSvgToCache(filename);

            const asset = await MediaLibrary.createAssetAsync(localUri);
            const album = await MediaLibrary.getAlbumAsync('Download');
            if (album == null) {
                await MediaLibrary.createAlbumAsync('Download', asset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
            }
            
            Toast.show({ type: 'success', text1: 'QR Code Saved', text2: 'Saved to your gallery/downloads folder.', visibilityTime: 3000 });

        } catch (e: any) {
            console.error('Download error:', e);
            Toast.show({ type: 'error', text1: 'Download Failed', text2: e.message || 'Could not save QR code.', visibilityTime: 4000 });
        }
    };

    const handleShare = async () => {
        if (!qrCodeData?.qr_code_data_uri) return;

        try {
            const filename = `product_barcode_${productId}.svg`;
            const localUri = await writeQrSvgToCache(filename);

            if (!(await Sharing.isAvailableAsync())) {
                Toast.show({ type: 'error', text1: 'Sharing not available on this device.' });
                return;
            }

            await Sharing.shareAsync(localUri, {
                mimeType: 'image/svg+xml',
                dialogTitle: `Share QR Code for Product ID ${productId}`,
            });
        } catch (e: any) {
             console.error('Sharing error:', e);
             Toast.show({ type: 'error', text1: 'Sharing Failed', text2: 'Could not share the file.', visibilityTime: 4000 });
        }
    };

    const handlePrint = async () => {
        if (!qrCodeData?.qr_code_data_uri) return;

        const barcodeHtml = `
            <html>
                <head>
                    <style>
                        body { text-align: center; margin-top: 50px; font-family: sans-serif; }
                        /* CRITICAL: Ensure the image loads by defining size and centering */
                        img { width: 90%; max-width: 400px; height: auto; margin: 0 auto; display: block;}
                        h1 { font-size: 24px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <img src="${qrCodeData.qr_code_data_uri}" />
                    <h1>${qrCodeData.barcode_text}</h1>
                    <p>Scan this QR code for traceability.</p>
                </body>
            </html>
        `;

        await Print.printAsync({ html: barcodeHtml });
    };


    if (loading) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#2563eb" /></View>;
    }

    if (error || !qrCodeData?.qr_code_data_uri) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {error || 'QR code URL not found.'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text>Go Back</Text></TouchableOpacity>
            </View>
        );
    }
    
    // --- Render Barcode using WebView ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product QR Code</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.qrCodeContainer}>
                    {/* WebView renders the QR from inline HTML — qr_code_html already
                        embeds the SVG as a base64 data: URI, so no second
                        (authenticated) network request is needed here.
                        baseUrl: '' + originWhitelist are required on Android:
                        without a baseUrl, source={{html}} loads at the
                        restrictive "about:blank" origin, where Android's
                        WebView (unlike iOS's WKWebView) silently refuses to
                        paint an <img src="data:..."> — the QR box renders
                        blank with no error. */}
                    <View style={styles.barcodeWrapper}>
                        <WebView
                            source={{ html: qrCodeData.qr_code_html, baseUrl: '' }}
                            originWhitelist={['*']}
                            // CRITICAL FIX: Ensure WebView is given full dimensions of the wrapper
                            style={styles.barcodeWebView}
                            scalesPageToFit={false} // Prevent scaling issues
                            startInLoadingState={true}
                            scrollEnabled={false}
                            javaScriptEnabled={true}
                        />
                    </View>

                    <Text style={styles.productText}>
                        {qrCodeData.barcode_text}
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleDownload}>
                        <Text style={styles.buttonText}>SAVE TO GALLERY</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={handleShare}>
                        <Text style={styles.buttonText}>SHARE VIA APPS</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                        <Text style={styles.buttonText}>PRINT BARCODE</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backButton: { paddingRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    errorText: { color: 'red', fontSize: 16, marginBottom: 20 },
    
    container: {
        alignItems: 'center',
        padding: 20,
    },
    qrCodeContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 6,
        marginBottom: 30,
    },
    barcodeWrapper: {
        // A real QR code is square, not the wide/short shape a linear
        // barcode needs — this used to be 100% wide x 100px tall, which
        // squashed the QR into an unscannable sliver.
        width: 240,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    barcodeWebView: {
        // CRITICAL FIX: Set explicit height/width to ensure the remote SVG renders
        width: '100%',
        height: '100%', 
    },
    productText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginTop: 5,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
        marginBottom: 15,
    },
    printButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 15,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProductQRCodeScreen;
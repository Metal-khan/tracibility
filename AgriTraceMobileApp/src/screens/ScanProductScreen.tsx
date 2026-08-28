import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Button, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CameraView, Camera } from 'expo-camera';
import Toast from 'react-native-toast-message';
import AsyncStorage from '../services/secureStorage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define RootStackParamList for navigation type safety
type RootStackParamList = {
  Login: undefined;
  FarmerDashboard: undefined;
  BuyerDashboard: undefined;
  LogisticsDashboard: undefined;
  ScanProduct: undefined;
  ProductInfoCategories: { productId: string }; 
};

type ScanProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ScanProduct'>;

const ScanProductScreen: React.FC = () => {
    const navigation = useNavigation<ScanProductScreenNavigationProp>();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    
    // Animation state
    const scanLineAnim = useRef(new Animated.Value(0)).current; 

    // --- Animation Logic ---
    const startScanAnimation = () => {
        scanLineAnim.setValue(0);
        Animated.loop(
            Animated.timing(scanLineAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        ).start();
    };

    useEffect(() => {
        const getPermissionsAndRole = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');

            const role = await AsyncStorage.getItem('userRole');
            setUserRole(role);
            
            if (!role) {
                Toast.show({ type: 'error', text1: 'Role Missing', text2: 'Please log out and log back in to refresh user data.', position: 'top' });
            }

            // Start animation once permissions are granted
            if (status === 'granted') {
                startScanAnimation();
            }
        };

        getPermissionsAndRole();
    }, []); 

    // Helper to allow user to retry scan immediately
    const handleRescan = () => {
        setScanned(false);
        Toast.show({ type: 'info', text1: 'Scanner Ready', text2: 'Please align the code in the frame.' });
    };

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || !userRole) return;

        setScanned(true); // Disable further scanning immediately

        // QR codes now encode a signed, opaque trace token (letters, digits,
        // "-", "_") rather than a plain numeric ID — stripping non-digit
        // characters, like this used to, would mangle every real token into
        // garbage. Still accepts a plain numeric ID too, for backward
        // compatibility with anything scanned from an older barcode.
        const productId = data.trim();

        if (!productId || !/^[A-Za-z0-9_-]+$/.test(productId)) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Product Code',
                text2: 'The scanned code is not a recognized product code. Tap below to retry.',
                position: 'bottom'
            });
            return;
        }
        
        Toast.show({ type: 'info', text1: 'Code Recognized', text2: `Processing ID: ${productId}...`, position: 'bottom' });

        // --- Role-Based Redirection ---
        if (userRole === 'buyer' || userRole === 'logistics') {
            setTimeout(() => {
                navigation.navigate('ProductInfoCategories', { productId });
            }, 500);
        } else {
            Toast.show({ 
                type: 'error', 
                text1: 'Unauthorized Role', 
                text2: `The role '${userRole}' cannot use this feature.`, 
                position: 'bottom' 
            });
            setTimeout(() => setScanned(false), 2000); 
        }
    };

    // Calculate animated position for the scan line
    const scanLinePosition = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'], // Move from top of scanFrame to bottom
    });

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Requesting camera permission...</Text>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>No access to camera. Please enable it in settings.</Text>
                <Button title="Open Settings" onPress={() => Linking.openSettings()} />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header remains positioned absolutely over the camera view */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Scan Product QR Code</Text>
            </View>
            
            {/* expo-camera's CameraView doesn't support children (SDK 54) —
                logs a warning and can behave inconsistently — so the scan
                frame overlay is a sibling, absolutely positioned over the
                camera by the wrapping cameraContainer, instead of nested
                inside it. */}
            <View style={styles.cameraContainer}>
                <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "code39", "code128"],
                    }}
                    style={styles.camera}
                />
                <View style={styles.overlay} pointerEvents="none">
                    {/* CRITICAL: Scan Frame Section (Positioned at the top) */}
                    <View style={styles.scanBoxWrapper}>
                        <Text style={styles.scanInstruction}>
                            Align the code within the horizontal frame.
                        </Text>

                        {/* The scanning window */}
                        <View style={styles.scanFrame}>
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    { transform: [{ translateY: scanLinePosition }] }
                                ]}
                            />
                        </View>
                        <Text style={styles.scanHint}>Scanning for Product ID...</Text>
                    </View>
                </View>
            </View>
            
            {/* Scan Message/Rescan Button appears at the bottom */}
            {scanned && (
                <View style={styles.scanMessageWrapper}>
                    <View style={styles.scanMessage}>
                        <Text style={styles.scanText}>Code detected! Analyzing data...</Text>
                        <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
                            <Text style={styles.rescanText}>Tap to Re-scan / Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: { 
        marginTop: 10,
        fontSize: 16,
        color: '#4b5563',
    },
    // --- HEADER STYLES ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 55, 
        position: 'absolute',
        top: 0, left: 0, right: 0, zIndex: 10,
        backgroundColor: 'transparent',
    },
    backButton: { marginRight: 10, padding: 5 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center', marginRight: 30 },
    // --- CAMERA/OVERLAY STYLES ---
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        // Positioned over the CameraView by cameraContainer, rather than
        // rendered as its child (see the render method for why).
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark translucent overlay for focus
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    scanBoxWrapper: {
        marginTop: 100, // Position frame well below the header
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    scanInstruction: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    scanHint: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 10,
    },
    scanFrame: {
        // Square, to match scanning a QR code rather than a linear barcode.
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: '#00cc00', // Professional green border
        borderRadius: 5,
        backgroundColor: 'transparent',
        overflow: 'hidden', // Crucial for scanLine animation boundary
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 3,
        backgroundColor: '#ff0000', // Animated red scanning line
        top: 0,
        opacity: 0.8,
    },
    // --- SCAN MESSAGE STYLES ---
    scanMessageWrapper: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    scanMessage: {
        backgroundColor: 'rgba(40, 167, 69, 0.95)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    scanText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rescanButton: {
        marginTop: 8,
    },
    rescanText: {
        color: '#fff',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#cc0000',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default ScanProductScreen;
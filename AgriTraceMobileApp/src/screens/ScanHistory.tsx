import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import Toast from 'react-native-toast-message';

// Define types for the navigation stack
type RootStackParamList = {
    BuyerDashboard: undefined;
    ScanHistory: undefined;
    ProductInfoCategories: { productId: string }; 
    FarmerProductDetails: { productId: string }; // CRITICAL: Added Farmer detail screen
};

type ScanHistoryNavigationProp = StackNavigationProp<RootStackParamList, 'ScanHistory'>;

// Define the expected structure for a history item (simplified from the checkpoint log)
interface HistoryItem {
    id: string; // The Product ID (used as key)
    name: string; // The product's name 
    date: string; // The date of the scan
    status: 'Scanned' | 'Reviewed' | 'Logged' | 'Created'; 
    product_id: string; // The ID encoded in the barcode
}

const ScanHistory: React.FC = () => {
    const navigation = useNavigation<ScanHistoryNavigationProp>();
    const [scanHistory, setScanHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);

    // --- API Fetch Logic ---
    const fetchScanHistory = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const role = await AsyncStorage.getItem('userRole');
            setUserRole(role);

            if (!token || !role) {
                Toast.show({ type: 'error', text1: 'Session Required', text2: 'Please log in to view history.' });
                return;
            }

            const endpoint = `/history/${role}`;
            
            const response = await api.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const mappedHistory: HistoryItem[] = response.data.history.map((item: any) => ({
                id: item.product_id.toString(),
                name: item.product_name || `${item.crop_type} (${item.variety})`,
                date: new Date(item.scan_timestamp || item.created_at).toLocaleDateString(),
                status: item.type || 'Scanned',
                product_id: item.product_id.toString(),
            }));

            setScanHistory(mappedHistory);

        } catch (error: any) {
            console.error('Scan History Fetch Error:', error.response?.data || error.message);
            Toast.show({ type: 'error', text1: 'Load Failed', text2: 'Could not fetch history data.' });
        } finally {
            setLoading(false);
        }
    };
    
    // Use useFocusEffect to refresh data every time the screen becomes focused
    useFocusEffect(
        React.useCallback(() => {
            fetchScanHistory();
        }, [])
    );


    // --- Render Component ---
    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            // CRITICAL FIX: Conditional Navigation
            onPress={() => {
                if (userRole === 'farmer') {
                    // Farmers go to their detail screen for editing/analytics
                    navigation.navigate('FarmerProductDetails', { productId: item.product_id });
                } else {
                    // Buyers/Logistics go to the public category hub
                    navigation.navigate('ProductInfoCategories', { productId: item.product_id });
                }
            }}
        >
            <View style={styles.textContainer}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.scanDate}>
                    {userRole === 'farmer' ? 'Last Scan:' : 'Scanned:'} {item.date}
                </Text>
            </View>
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, styles[`status_${item.status}` as keyof typeof styles]]}>
                    {item.status}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {userRole === 'farmer' ? 'Product Scan Analytics' : 'My Recent Scans'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Fetching history...</Text>
                </View>
            ) : (
                <FlatList
                    data={scanHistory}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No scan history recorded yet.</Text>}
                />
            )}
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { paddingRight: 10 },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4b5563',
    },
    list: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    textContainer: { flex: 1 },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    scanDate: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginRight: 8,
        color: '#fff',
    },
    // Status color mapping
    status_Reviewed: { backgroundColor: '#28a745' },
    status_Scanned: { backgroundColor: '#007bff' },
    status_Logged: { backgroundColor: '#ffc107', color: '#333' },
    status_Created: { backgroundColor: '#6c757d' }, 
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    }
});

export default ScanHistory;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Toast from 'react-native-toast-message';

type RootStackParamList = { 
    FarmerDashboard: undefined; 
    SubscriptionManagement: undefined;
    Subscription: undefined; // To allow navigation back to the plan selector
};
type SubscriptionManagementNavigationProp = StackNavigationProp<RootStackParamList, 'SubscriptionManagement'>;

// Define the expected user data structure for subscription status
interface UserSubscriptionData {
    name: string;
    email: string;
    status: string;
    subscription_plan: string;
    remaining_products: number;
    subscription_end_date: string; // ISO date string
}

const SubscriptionManagement: React.FC = () => {
    const navigation = useNavigation<SubscriptionManagementNavigationProp>();
    const [userData, setUserData] = useState<UserSubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptionData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                navigation.replace('Login' as any); 
                return;
            }

            // Assuming the /user endpoint returns all required subscription fields
            const response = await api.get('/user', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Map the API response to the state
            setUserData(response.data);

        } catch (err: any) {
            console.error('Fetch Subscription Error:', err.response?.data || err.message);
            setError('Failed to load subscription details. Please check connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const handleUpgrade = () => {
        // Navigate the user back to the main Subscription screen to select a new plan
        navigation.navigate('Subscription');
    };

    const formatDate = (isoDate: string | undefined) => {
        if (!isoDate) return 'N/A';
        try {
            return new Date(isoDate).toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
    };

    const statusColor = userData?.status === 'approved' || userData?.status === 'active' ? '#28a745' : '#dc3545';

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.subtitle}>Loading subscription details...</Text>
            </SafeAreaView>
        );
    }
    
    if (error || !userData) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {error || 'No user data found.'}</Text>
                <Button title="Retry" onPress={fetchSubscriptionData} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Subscription Management</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container}>

                {/* Status Card */}
                <View style={styles.statusCard}>
                    <MaterialCommunityIcons name="check-decagram" size={30} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        Account Status: {userData.status.toUpperCase()}
                    </Text>
                </View>

                {/* Plan Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Current Subscription Plan</Text>
                    
                    {/* Dynamic Data Display */}
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="tag-multiple" size={20} color="#2563eb" />
                        <Text style={styles.label}>Plan:</Text>
                        <Text style={styles.value}>{userData.subscription_plan || 'No Active Plan'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="calendar-end" size={20} color="#2563eb" />
                        <Text style={styles.label}>End Date:</Text>
                        <Text style={styles.value}>{formatDate(userData.subscription_end_date)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="account-circle-outline" size={20} color="#2563eb" />
                        <Text style={styles.label}>Account Owner:</Text>
                        <Text style={styles.value}>{userData.name}</Text>
                    </View>
                </View>

                {/* Product Count Card */}
                <View style={[styles.card, styles.productCard]}>
                    <Text style={styles.productCountTitle}>Products Remaining</Text>
                    <Text style={styles.productCountValue}>
                        {userData.remaining_products === 9999 ? 'UNLIMITED' : userData.remaining_products}
                    </Text>
                    <Text style={styles.productCountUnit}>
                        of {userData.subscription_plan.includes('FREE') ? '3' : 'Your Plan Limit'}
                    </Text>
                </View>
                
                {/* Action Button */}
                {(userData.remaining_products <= 5 && userData.remaining_products !== 9999) && (
                    <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                        <Text style={styles.upgradeButtonText}>Upgrade Plan / Buy More Products</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                    </TouchableOpacity>
                )}

            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' },
    container: { 
        paddingHorizontal: 20, 
        paddingVertical: 20, 
        alignItems: 'center' 
    },
    header: { 
        flexDirection: 'row', alignItems: 'center', padding: 15, 
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
    },
    backButton: { paddingRight: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 10 },
    errorText: { color: 'red', fontSize: 16 },

    // Status Bar
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#e9f7ef',
        borderRadius: 10,
        marginBottom: 20,
        width: '100%',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },

    // Main Detail Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginLeft: 10,
        flex: 1,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    // Product Count Card
    productCard: {
        alignItems: 'center',
        backgroundColor: '#fff3cd', // Light warning color
        borderWidth: 1,
        borderColor: '#ffc107',
    },
    productCountTitle: {
        fontSize: 16,
        color: '#856404', // Dark yellow text
        marginBottom: 5,
    },
    productCountValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#856404',
    },
    productCountUnit: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 10,
    },

    // Action Button
    upgradeButton: {
        flexDirection: 'row',
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 6,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SubscriptionManagement;
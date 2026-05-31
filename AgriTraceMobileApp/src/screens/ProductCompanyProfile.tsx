import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// --- INTERFACES ---
interface FarmerDetails {
    name: string;
    contact_number: string;
    status: string;
    farm_name: string;
    // Add any other specific farmer fields retrieved from the API
    [key: string]: any; 
}

interface ProductDataForProfile {
    id: number;
    origin_location_address: string;
    farmer: FarmerDetails | null;
    [key: string]: any; 
}

type ProductDetailsRouteParams = {
    title: string;
    data: ProductDataForProfile;
};

type RootStackParamList = {
    ProductCompanyProfile: ProductDetailsRouteParams;
};

type ProductCompanyProfileRouteProp = RouteProp<RootStackParamList, 'ProductCompanyProfile'>;

const ProductCompanyProfile: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<ProductCompanyProfileRouteProp>();
    
    // Safely extract the data
    const productData = route.params.data;
    const farmerData = productData.farmer || {};

    // --- DYNAMIC DATA EXTRACTION ---
    const farmerName = farmerData.name || 'N/A';
    const farmName = farmerData.farm_name || 'N/A (Farm Name Missing)';
    const contactNumber = farmerData.contact_number || 'N/A';
    const address = productData.origin_location_address || 'N/A';
    const status = farmerData.status || 'N/A'; 
    
    // Mock data for aggregates (Still rely on frontend mock until backend is built)
    const dynamicAggregates = {
        total_products_posted: 124, // Mock
        overall_review_rating: 4.6, // Mock
        foundation_date: '2018-05-15', // Mock
    };

    const handleCall = () => {
        if (contactNumber === 'N/A') {
             Toast.show({ type: 'info', text1: 'Contact Info Missing.', visibilityTime: 3000 });
             return;
        }
        const url = `tel:${contactNumber}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Toast.show({ type: 'error', text1: 'Calling not supported.', visibilityTime: 3000 });
            }
        });
    };

    const renderDetailRow = (icon: string, label: string, value: string | number | undefined, isAction = false, onPress?: () => void) => (
        <TouchableOpacity 
            style={styles.detailRow}
            onPress={onPress}
            disabled={!isAction}
        >
            <MaterialCommunityIcons name={icon as any} size={24} color="#2563eb" style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
            {isAction && <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Company Profile</Text>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileCard}>
                    <MaterialCommunityIcons name="barn" size={60} color="#28a745" />
                    <Text style={styles.mainTitle}>{farmName}</Text>
                    <Text style={styles.subTitle}>Farmer: {farmerName}</Text>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    {renderDetailRow('account-box-outline', 'Registered Name', farmerName)}
                    {renderDetailRow('domain', 'Farm/Entity Name', farmName)}
                    {renderDetailRow('calendar', 'Foundation Date', dynamicAggregates.foundation_date)}
                    {renderDetailRow('check-circle-outline', 'Status', status)}
                </View>

                {/* Contact and Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact & Location</Text>
                    {renderDetailRow('phone', 'Contact Number', contactNumber, true, handleCall)}
                    {renderDetailRow('map-marker-outline', 'Primary Address', address)}
                </View>

                {/* Performance Metrics (Aggregates) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Company Performance</Text>
                    {renderDetailRow('seed-outline', 'Total Products Posted', dynamicAggregates.total_products_posted)}
                    {renderDetailRow('star', 'Overall Review Rating', `${dynamicAggregates.overall_review_rating} / 5.0`)}
                    {renderDetailRow('certificate-outline', 'Certifications', 'View Documents', true, () => {
                         Toast.show({ type: 'info', text1: 'Feature coming soon!', text2: 'Navigating to Certificates screen.', visibilityTime: 3000 });
                    })}
                </View>
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { 
        flexDirection: 'row', alignItems: 'center', padding: 15, 
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
    },
    backButton: { paddingRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    container: { padding: 20 },

    profileCard: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    mainTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 10, color: '#2c3e50' },
    subTitle: { fontSize: 16, color: '#666', marginTop: 5 },

    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 15,
        backgroundColor: '#f5f5f5',
        color: '#2563eb',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    icon: {
        marginRight: 15,
        width: 24,
        textAlign: 'center',
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#888',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});

export default ProductCompanyProfile;
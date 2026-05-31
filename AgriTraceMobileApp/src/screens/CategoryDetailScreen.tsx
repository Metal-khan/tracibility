import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Button, TouchableOpacity, Image } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// Define the expected structure for the main product data
interface ProductDetailsData {
    // Crop Details
    crop_type?: string;
    variety?: string;
    farming_method?: string;
    season?: string;
    sowing_date?: string;
    harvest_date?: string;
    estimated_yield?: number;
    actual_yield?: number;
    quality_grade?: string;

    // Origin Details
    origin_location_address?: string;
    province?: string;
    district?: string;
    origin_location_lat?: number;
    origin_location_lon?: number;

    // Packaging Details
    collection_date?: string;
    storage_method?: string;
    packaging_type?: string;
    num_packages?: number;
    weight_per_unit?: number;
    total_weight?: number;

    // Gallery
    photos_urls_array?: string[];
    
    [key: string]: any; 
}

type CategoryDetailRouteParams = {
    title: string;
    data: ProductDetailsData | any[]; // Data can be a product object or an array (like photos)
    checkpoints?: any[]; // Only used for Logistics/Trace
};

type RootStackParamList = {
    CategoryDetail: CategoryDetailRouteParams;
};
type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

const CategoryDetailScreen: React.FC = () => {
    const route = useRoute<CategoryDetailRouteProp>();
    const navigation = useNavigation();
    const { title, data, checkpoints } = route.params;
    
    // Type assertion for product data since the generic screen receives various types
    const productData = data as ProductDetailsData;

    const renderDetailRow = (icon: string, label: string, value: string | number | undefined) => (
        <View style={styles.detailRow}>
            <MaterialCommunityIcons name={icon as any} size={24} color="#007bff" style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || 'N/A'}</Text>
            </View>
        </View>
    );
    
    // --- Specific Content Renderer ---
    const renderContent = () => {
        // 1. Crop & Product Details (Previously implemented logic remains)
        if (title === 'Crop & Product Details') {
             return (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Harvest & Crop Cycle</Text>
                    {renderDetailRow('food-apple-outline', 'Crop Type', productData.crop_type)}
                    {renderDetailRow('grain', 'Variety/Cultivar', productData.variety)}
                    {renderDetailRow('tractor', 'Farming Method', productData.farming_method)}
                    {renderDetailRow('calendar-check', 'Harvest Date', productData.harvest_date)}

                    <Text style={[styles.cardTitle, { marginTop: 20 }]}>Yield & Quality</Text>
                    {renderDetailRow('scale', 'Actual Yield', productData.actual_yield)}
                    {renderDetailRow('star-circle-outline', 'Quality Grade', productData.quality_grade)}
                </View>
            );
        }

        // 2. Geographical Origin Details (NEW)
        if (title === 'Geographical Origin') {
             return (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Source Location</Text>
                    {renderDetailRow('map-marker-radius', 'Address', productData.origin_location_address)}
                    {renderDetailRow('city', 'Province/State', productData.province)}
                    {renderDetailRow('city-variant', 'District', productData.district)}
                    
                    <Text style={[styles.cardTitle, { marginTop: 20 }]}>Coordinates</Text>
                    {renderDetailRow('latitude', 'Latitude', productData.origin_location_lat)}
                    {renderDetailRow('longitude', 'Longitude', productData.origin_location_lon)}
                </View>
            );
        }

        // 3. Logistics Trace (Packaging, Storage, and Checkpoints)
        if (title === 'Supply Chain & Logistics' && checkpoints && Array.isArray(checkpoints)) {
            return (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Packaging & Storage</Text>
                    {renderDetailRow('archive-outline', 'Storage Method', productData.storage_method)}
                    {renderDetailRow('package-variant', 'Packaging Type', productData.packaging_type)}
                    {renderDetailRow('weight-kilogram', 'Total Weight', `${productData.total_weight} kg`)}

                    <Text style={[styles.cardTitle, { marginTop: 20 }]}>Trace Steps ({checkpoints.length})</Text>
                    {checkpoints.map((cp: any, index: number) => (
                        <View key={index} style={styles.checkpointItem}>
                            <Text style={styles.checkpointTitle}>{cp.location}</Text>
                            <Text style={styles.checkpointSubDetail}>Notes: {cp.notes}</Text>
                            <Text style={styles.checkpointSubDetail}>Date: {new Date(cp.timestamp).toLocaleDateString()}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        // 4. Gallery (NEW)
        if (title === 'Product Gallery' && Array.isArray(data)) {
            const photoUrls = data as string[];
            if (photoUrls.length === 0) {
                 return <Text style={styles.emptyText}>No images uploaded for this product.</Text>;
            }
            return (
                <View>
                    <Text style={styles.cardTitle}>Product Photos ({photoUrls.length})</Text>
                    <FlatList
                        data={photoUrls}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={2}
                        renderItem={({ item }) => (
                            <Image 
                                source={{ uri: item }} 
                                style={styles.galleryImage}
                            />
                        )}
                        contentContainerStyle={styles.galleryGrid}
                    />
                </View>
            );
        }
        
        // 5. Certificates & Sustainability (NEW PLACEHOLDERS)
        if (title === 'Quality Certificates' || title === 'Sustainability & Practices') {
            return (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.detailText}>Details for this category are not yet structured on the backend.</Text>
                    <Text style={styles.jsonText}>Raw Data: {JSON.stringify(data, null, 2)}</Text>
                </View>
            );
        }


        // Default Fallback
        return <Text style={styles.errorText}>Category content not yet implemented.</Text>;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {renderContent()}
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
    scrollContainer: { padding: 20, flexGrow: 1 },
    header: { 
        flexDirection: 'row', alignItems: 'center', padding: 15, 
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' 
    },
    backButton: { paddingRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    // Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2563eb',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 5,
    },
    
    // Detail Row
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f7f7f7',
    },
    icon: {
        marginRight: 15,
        width: 30,
        textAlign: 'center',
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: '#888',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    // Checkpoint/Trace Styles
    checkpointItem: { 
        marginBottom: 15, 
        paddingLeft: 10, 
        borderLeftWidth: 3, 
        borderLeftColor: '#28a745' 
    },
    checkpointTitle: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: '#333' 
    },
    checkpointSubDetail: { 
        fontSize: 14, 
        color: '#666', 
        marginLeft: 10 
    },
    
    // Gallery Styles
    galleryGrid: {
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    galleryImage: {
        width: '48%', 
        aspectRatio: 1,
        marginBottom: 10,
        borderRadius: 8,
    },

    // Fallback/Error Styles
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        padding: 20,
    },
    jsonText: { fontSize: 14, color: '#555', backgroundColor: '#eef', padding: 10, borderRadius: 5 },
    detailText: { fontSize: 16, color: '#333', marginBottom: 8 },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginTop: 50 },
});

export default CategoryDetailScreen;
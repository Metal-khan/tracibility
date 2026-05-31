import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Button } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define complex types for the data we fetch
type ProductDetails = {
    id: number;
    crop_type: string;
    variety: string;
    harvest_date: string;
    origin_location_address: string;
    quality_grade: string;
    farming_method: string;
    photos_urls_array?: string[];
    certifications?: string[];
    farmer?: {
        name: string;
        contact_number: string;
    }
};

type Checkpoint = {
    id: number;
    location: string;
    notes: string;
    timestamp: string;
};

// Define RootStackParamList for navigation type safety
type RootStackParamList = {
    Login: undefined;
    BuyerDashboard: undefined;
    ProductInfoCategories: { productId: string };
    CategoryDetail: { title: string, data: any, checkpoints: Checkpoint[] }; 
    BuyerReviewsScreen: { productId: string };
    ProductCompanyProfile: { title: string, data: any }; // Added for type safety
};

type ProductInfoCategoriesRouteProp = RouteProp<RootStackParamList, 'ProductInfoCategories'>;
type ProductInfoCategoriesNavigationProp = StackNavigationProp<RootStackParamList, 'ProductInfoCategories'>;


const ProductInfoCategories: React.FC = () => {
    const navigation = useNavigation<ProductInfoCategoriesNavigationProp>();
    const route = useRoute<ProductInfoCategoriesRouteProp>();
    const { productId } = route.params;

    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchProductDetails = async () => {
            setLoading(true);
            setError(null);
            const token = await AsyncStorage.getItem('userToken'); 
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            try {
                // 1. Fetch Product Details and Checkpoints
                const response = await api.get(`/scan/${productId}`, { headers }); 
                
                setProduct(response.data.product);
                setCheckpoints(response.data.checkpoints || []); 

                // 2. Log Buyer Checkpoint
                await api.post(`/checkpoints/${productId}`, { 
                    location_address: "Consumer Scan (Product Reached Buyer)", 
                    location_lat: 0.0,
                    location_lon: 0.0,
                    notes: "Initial Buyer Scan for authentication and review",
                }, { headers });
                
            } catch (err: any) {
                const message = err.response?.data?.message || err.message;
                setError(message);
                
                if (err.response?.status === 401) navigation.replace('Login'); 
            } finally {
                setLoading(false);
            }
        };
        fetchProductDetails();
    }, [productId, navigation]);


    // Define the Menu Categories
    const categories = [
        { 
            name: "Company Profile", 
            icon: "office-building", 
            dataKey: "farmer",
            title: "Farmer / Company Profile"
        },
        { 
            name: "Product Details", 
            icon: "seed", 
            dataKey: "product", 
            title: "Crop & Product Details" 
        },
        { 
            name: "Origin Details", 
            icon: "map-marker-radius", 
            dataKey: "origin",
            title: "Geographical Origin"
        },
        { 
            name: "Certificates", 
            icon: "certificate", 
            dataKey: "certifications",
            title: "Quality Certificates"
        },
        { 
            name: "Logistics Trace", 
            icon: "truck-fast", 
            dataKey: "checkpoints",
            title: "Supply Chain & Logistics"
        },
        { 
            name: "Sustainability", 
            icon: "leaf", 
            dataKey: "sustainability",
            title: "Sustainability & Practices"
        },
        { 
            name: "Gallery", 
            icon: "image-multiple", 
            dataKey: "gallery",
            title: "Product Gallery"
        },
        { 
            name: "Reviews & Ratings", 
            icon: "star-box", 
            dataKey: "reviews",
            title: "Customer Reviews"
        },
    ];

    const handleCategoryPress = (category: typeof categories[0]) => {
        if (!product) return;

        if (category.dataKey === 'reviews') {
            // Direct to the specific Reviews screen
            navigation.navigate('BuyerReviewsScreen', { productId: productId });
        } else if (category.dataKey === 'farmer') {
             // Direct to the specific Company Profile screen
             navigation.navigate('ProductCompanyProfile', { 
                title: category.title, 
                data: product,
            });
        } 
        // Handle generic screens (Logistics, Gallery, etc.)
        else if (category.dataKey === 'checkpoints') {
            navigation.navigate('CategoryDetail' as any, { 
                title: category.title, 
                data: checkpoints,
                checkpoints: checkpoints,
            });
        } else if (category.dataKey === 'gallery') {
             const galleryData = product.photos_urls_array || [];
             navigation.navigate('CategoryDetail' as any, { 
                title: category.title, 
                data: galleryData,
            });
        } else {
             // Default generic detail view for all other categories
             navigation.navigate('CategoryDetail' as any, { 
                title: category.title, 
                data: product,
            });
        }
    };


    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Fetching Product Trace Data...</Text>
            </SafeAreaView>
        );
    }

    if (error || !product) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error || 'Could not load product data.'}</Text>
                <Button title="Back to Dashboard" onPress={() => navigation.navigate('BuyerDashboard')} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Product: {product.crop_type}</Text>
            </View>
            
            <FlatList
                data={categories}
                keyExtractor={(item) => item.name}
                numColumns={2} 
                key={2} // FIX: Added a key to resolve the invariant violation during hot reload
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={styles.categoryCard}
                        onPress={() => handleCategoryPress(item)}
                    >
                        <MaterialCommunityIcons name={item.icon as any} size={55} color="#28a745" /> 
                        <Text style={styles.categoryText}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.gridContainer}
            />

            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#4b5563' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffe5e5', padding: 20 },
    errorText: { fontSize: 16, color: '#cc0000', textAlign: 'center', marginBottom: 20 },
    
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: { paddingRight: 10 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', flexShrink: 1 },

    gridContainer: {
        padding: 10,
        alignItems: 'center',
    },
    categoryCard: {
        backgroundColor: '#fff',
        width: '46%', // 2-Column layout width
        aspectRatio: 1,
        borderRadius: 10,
        padding: 15,
        margin: '2%', 
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    categoryText: {
        fontSize: 14, 
        fontWeight: '600',
        color: '#333',
        marginTop: 10, 
        textAlign: 'center',
    },
});

export default ProductInfoCategories;
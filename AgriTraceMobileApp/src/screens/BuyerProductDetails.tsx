import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Button, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define the assumed structure for the product details and checkpoints
type ProductDetails = {
    id: number;
    crop_type: string;
    variety: string;
    harvest_date: string;
    origin_location_address: string;
    quality_grade: string;
    farming_method: string;
};

type Checkpoint = {
    id: number;
    location: string;
    notes: string;
    timestamp: string;
};

type RootStackParamList = {
    Login: undefined;
    BuyerDashboard: undefined;
    BuyerProductDetails: { productId: string };
};

type BuyerProductDetailsRouteProp = RouteProp<RootStackParamList, 'BuyerProductDetails'>;

const BuyerProductDetails: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<BuyerProductDetailsRouteProp>();
    const { productId } = route.params;

    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]); // State for trace history
    const [loading, setLoading] = useState<boolean>(true);
    const [reviewLoading, setReviewLoading] = useState<boolean>(false);
    const [reviewText, setReviewText] = useState<string>('');
    const [rating, setRating] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductDetails = async () => {
            setLoading(true);
            setError(null);
            
            const token = await AsyncStorage.getItem('userToken'); 
            
            if (!token) {
                 setError("User session expired. Please log in.");
                 setLoading(false);
                 navigation.replace('Login'); 
                 return;
            }

            // Define headers to include the token for authorization
            const headers = { Authorization: `Bearer ${token}` };

            try {
                // 1. Fetch Product Details and Checkpoints
                const response = await api.get(`/scan/${productId}`, { headers }); 
                
                setProduct(response.data.product);
                setCheckpoints(response.data.checkpoints || []); 

                // 2. Log Buyer Checkpoint (FIX: Corrected payload structure)
                await api.post(`/checkpoints/${productId}`, { 
                    // Backend validation requires these three specific fields
                    location_address: "Consumer Scan (Product Reached Buyer)", 
                    location_lat: 0.0, // Using placeholder data for end-user scan
                    location_lon: 0.0, // Using placeholder data for end-user scan
                    
                    notes: "Initial Buyer Scan for authentication and review",
                }, { headers }); 
                
            } catch (err: any) {
                console.error('Failed to fetch product details:', err.response?.data || err.message);
                
                if (err.response?.status === 401 || err.response?.data?.message.includes("Unauthenticated")) {
                    setError("Session expired. Please log in again.");
                    Toast.show({ type: 'error', text1: 'Session Expired', text2: 'Please log in again.', position: 'top' });
                    navigation.replace('Login'); 
                } else if (err.response?.data?.message) {
                    // Display the validation or non-auth error message
                    setError(err.response.data.message);
                } else {
                    setError('Product not found or failed to load scan data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [productId]);

    const handleReviewSubmit = async () => {
        if (rating === 0 || reviewText.trim() === '') {
            Toast.show({ type: 'error', text1: 'Review Error', text2: 'Please provide a rating and comment.', position: 'bottom' });
            return;
        }

        setReviewLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                navigation.replace('Login');
                return;
            }

            await api.post(`/products/${productId}/reviews`, { 
                rating: rating,
                comment: reviewText.trim(),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Toast.show({ type: 'success', text1: 'Success', text2: 'Review submitted successfully!', position: 'bottom' });
            setReviewText('');
            setRating(0); 
        } catch (err: any) {
            console.error('Failed to submit review:', err.response?.data || err.message);
            Toast.show({ type: 'error', text1: 'Submission Failed', text2: err.response?.data?.message || 'Failed to submit review.', position: 'bottom' });
        } finally {
            setReviewLoading(false);
        }
    };

    const renderRatingStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <TouchableOpacity key={i} onPress={() => setRating(i)}>
                    <MaterialCommunityIcons 
                        name={i <= rating ? "star" : "star-outline"} 
                        size={30} 
                        color={i <= rating ? "#ffc107" : "#ccc"} 
                        style={styles.starIcon}
                    />
                </TouchableOpacity>
            );
        }
        return <View style={styles.ratingContainer}>{stars}</View>;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading Product Details...</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <Button title="Back to Dashboard" onPress={() => navigation.navigate('BuyerDashboard')} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>{'<'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Product Traceability</Text>
                </View>

                {/* Card 1: Product Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Product Details</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Crop:</Text> {product.crop_type}</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Variety:</Text> {product.variety}</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Harvested:</Text> {product.harvest_date}</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Origin:</Text> {product.origin_location_address}</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Grade:</Text> {product.quality_grade}</Text>
                    <Text style={styles.detailText}><Text style={styles.boldText}>Method:</Text> {product.farming_method}</Text>
                </View>
                
                {/* Card 2: Trace History (The Supply Chain) */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Supply Chain Trace ({checkpoints.length} Steps)</Text>
                    {checkpoints.length > 0 ? (
                        checkpoints.map((cp, index) => (
                            <View key={index} style={styles.checkpointItem}>
                                <Text style={styles.checkpointLocation}>
                                    <Text style={styles.boldText}>{index + 1}.</Text> {cp.location}
                                </Text>
                                <Text style={styles.checkpointNotes}>
                                    Notes: {cp.notes}
                                </Text>
                                <Text style={styles.checkpointDate}>
                                    Date: {new Date(cp.timestamp).toLocaleDateString()}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.detailText}>No traceable history found for this product yet. Did you create one as a farmer?</Text>
                    )}
                </View>


                {/* Card 3: Leave a Review */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Leave a Review</Text>
                    {renderRatingStars()}
                    <TextInput
                        style={styles.input}
                        placeholder="Share your feedback (e.g., product quality)"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={reviewText}
                        onChangeText={setReviewText}
                        editable={!reviewLoading}
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={handleReviewSubmit} disabled={reviewLoading || rating === 0}>
                        {reviewLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Review</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, paddingVertical: 20 },
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 10, padding: 5 },
    backButtonText: { fontSize: 24, color: '#333', fontWeight: 'bold' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 10, fontSize: 16, color: '#4b5563' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffe5e5', padding: 20 },
    errorText: { fontSize: 16, color: '#cc0000', textAlign: 'center', marginBottom: 20 },
    card: {
        backgroundColor: '#fff', borderRadius: 15, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        marginBottom: 20, width: '100%',
    },
    cardTitle: {
        fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15,
        borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10,
    },
    detailText: { fontSize: 16, color: '#333', marginBottom: 8 },
    boldText: { fontWeight: 'bold' },
    
    // Review Styles
    ratingContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
    starIcon: { marginHorizontal: 5 },
    input: {
        minHeight: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10,
        marginBottom: 15, textAlignVertical: 'top', fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

    // Trace History (Checkpoint) Styles
    checkpointItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingLeft: 10,
        marginBottom: 5,
        borderLeftWidth: 3,
        borderLeftColor: '#28a745', 
    },
    checkpointDate: {
        fontSize: 14,
        color: '#888',
        marginTop: 3,
    },
    checkpointLocation: {
        fontSize: 16,
        color: '#333',
        marginBottom: 3,
    },
    checkpointNotes: {
        fontSize: 14,
        color: '#555',
        fontStyle: 'italic',
    },
});

export default BuyerProductDetails;
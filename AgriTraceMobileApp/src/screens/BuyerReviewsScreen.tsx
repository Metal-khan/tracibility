// src/screens/BuyerReviewsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';

type RootStackParamList = {
    BuyerReviewsScreen: { productId: string };
};
type BuyerReviewsRouteProp = RouteProp<RootStackParamList, 'BuyerReviewsScreen'>;

interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    status: string;
    created_at: string;
    buyer: { id: number; name: string } | null;
}

interface MyReview {
    id: number;
    rating: number;
    comment: string | null;
    status: string;
}

interface ReviewsResponse {
    reviews: ReviewItem[];
    average_rating: number;
    review_count: number;
    my_review: MyReview | null;
}

const StarRow: React.FC<{ rating: number; size?: number }> = ({ rating, size = 20 }) => (
    <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
            <MaterialCommunityIcons
                key={n}
                name={n <= rating ? 'star' : 'star-outline'}
                size={size}
                color="#f5a623"
            />
        ))}
    </View>
);

const BuyerReviewsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<BuyerReviewsRouteProp>();
    const { productId } = route.params;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<ReviewsResponse | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [selectedRating, setSelectedRating] = useState(0);
    const [comment, setComment] = useState('');

    const fetchReviews = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const role = await AsyncStorage.getItem('userRole');
            setUserRole(role);

            const response = await api.get(`/products/${productId}/reviews`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(response.data);
        } catch (err: any) {
            console.error('Failed to load reviews:', err.response?.data || err.message);
            Toast.show({ type: 'error', text1: 'Could not load reviews.', position: 'bottom' });
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async () => {
        if (selectedRating < 1) {
            Toast.show({ type: 'error', text1: 'Please select a star rating.', position: 'bottom' });
            return;
        }
        setSubmitting(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await api.post(`/products/${productId}/reviews`, {
                rating: selectedRating,
                comment: comment.trim() || undefined,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            Toast.show({ type: 'success', text1: 'Review submitted!', text2: 'Awaiting moderation.', position: 'bottom' });
            setSelectedRating(0);
            setComment('');
            await fetchReviews();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to submit review.';
            Toast.show({ type: 'error', text1: message, position: 'bottom' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Reviews & Ratings</Text>
                <Button title="Back" onPress={() => navigation.goBack()} />
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 30 }} />
                ) : (
                    <>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryRating}>{data?.average_rating ?? 0} / 5.0</Text>
                            <StarRow rating={Math.round(data?.average_rating ?? 0)} size={24} />
                            <Text style={styles.summaryCount}>
                                {data?.review_count ?? 0} approved review{data?.review_count === 1 ? '' : 's'}
                            </Text>
                        </View>

                        {userRole === 'buyer' && (
                            data?.my_review ? (
                                <View style={styles.myReviewCard}>
                                    <Text style={styles.sectionLabel}>Your Review</Text>
                                    <StarRow rating={data.my_review.rating} />
                                    {!!data.my_review.comment && <Text style={styles.reviewComment}>{data.my_review.comment}</Text>}
                                    <Text style={styles.reviewStatus}>
                                        {data.my_review.status === 'approved' ? 'Published' : 'Awaiting moderation'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.formCard}>
                                    <Text style={styles.sectionLabel}>Leave a Review</Text>
                                    <View style={styles.starPicker}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <TouchableOpacity key={n} onPress={() => setSelectedRating(n)}>
                                                <MaterialCommunityIcons
                                                    name={n <= selectedRating ? 'star' : 'star-outline'}
                                                    size={36}
                                                    color="#f5a623"
                                                    style={{ marginHorizontal: 4 }}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder="Share your experience with this product (optional)"
                                        placeholderTextColor="#999"
                                        value={comment}
                                        onChangeText={setComment}
                                        multiline
                                        numberOfLines={3}
                                        editable={!submitting}
                                    />
                                    <TouchableOpacity
                                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                                        onPress={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.submitButtonText}>Submit Review</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )
                        )}

                        <Text style={styles.sectionLabel}>All Reviews</Text>
                        {!data?.reviews.length ? (
                            <Text style={styles.emptyText}>No reviews yet.</Text>
                        ) : (
                            data.reviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewCardHeader}>
                                        <Text style={styles.reviewerName}>{review.buyer?.name || 'Anonymous'}</Text>
                                        <StarRow rating={review.rating} />
                                    </View>
                                    {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    container: { padding: 20 },
    starRow: { flexDirection: 'row' },
    summaryCard: {
        backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 20,
        borderWidth: 1, borderColor: '#eee',
    },
    summaryRating: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50' },
    summaryCount: { fontSize: 14, color: '#888', marginTop: 5 },
    sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    formCard: {
        backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20,
        borderWidth: 1, borderColor: '#eee',
    },
    starPicker: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
    commentInput: {
        borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#333',
        minHeight: 80, textAlignVertical: 'top', marginBottom: 15, backgroundColor: '#fafafa',
    },
    submitButton: {
        backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 8, alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    myReviewCard: {
        backgroundColor: '#f0f9ff', borderRadius: 10, padding: 15, marginBottom: 20,
        borderWidth: 1, borderColor: '#cfe8fc',
    },
    reviewStatus: { fontSize: 13, color: '#666', marginTop: 8, fontStyle: 'italic' },
    emptyText: { fontSize: 15, color: '#888', textAlign: 'center', marginVertical: 20 },
    reviewCard: {
        backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12,
        borderWidth: 1, borderColor: '#eee',
    },
    reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    reviewerName: { fontSize: 15, fontWeight: '600', color: '#333' },
    reviewComment: { fontSize: 14, color: '#555', marginTop: 4, lineHeight: 20 },
    reviewDate: { fontSize: 12, color: '#999', marginTop: 8 },
});

export default BuyerReviewsScreen;

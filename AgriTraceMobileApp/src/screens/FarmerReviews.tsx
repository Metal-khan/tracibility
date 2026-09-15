import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';

type RootStackParamList = { FarmerDashboard: undefined; FarmerReviews: undefined; };
type FarmerReviewsNavigationProp = StackNavigationProp<RootStackParamList, 'FarmerReviews'>;

interface ReviewItem {
  id: number;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  buyer?: { id: number; name: string } | null;
  product?: { id: number; crop_type: string; variety: string } | null;
}

const StarRow: React.FC<{ rating: number }> = ({ rating }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((n) => (
      <MaterialCommunityIcons key={n} name={n <= rating ? 'star' : 'star-outline'} size={18} color="#f5a623" />
    ))}
  </View>
);

const FarmerReviews: React.FC = () => {
  const navigation = useNavigation<FarmerReviewsNavigationProp>();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userRole = await AsyncStorage.getItem('userRole');
      setRole(userRole);
      const response = await api.get('/my-reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(response.data.reviews || []);
    } catch (err: any) {
      console.error('Failed to load my-reviews:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Could not load reviews.', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    const unsubscribe = navigation.addListener('focus', fetchReviews);
    return unsubscribe;
  }, [navigation, fetchReviews]);

  const subtitle = role === 'buyer'
    ? 'Reviews you’ve written for products you’ve bought.'
    : 'Reviews customers have left on your products.';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 30 }} />
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>
          {role === 'buyer' ? 'You haven’t written any reviews yet.' : 'No reviews yet on your products.'}
        </Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewCardHeader}>
              <Text style={styles.productName}>
                {review.product?.crop_type || 'Product'}{review.product?.variety ? ` — ${review.product.variety}` : ''}
              </Text>
              <StarRow rating={review.rating} />
            </View>
            {role === 'farmer' && !!review.buyer?.name && (
              <Text style={styles.reviewerName}>From: {review.buyer.name}</Text>
            )}
            {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
            <View style={styles.reviewFooter}>
              <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
              <Text style={[styles.statusBadge, review.status === 'approved' ? styles.statusApproved : styles.statusPending]}>
                {review.status === 'approved' ? 'Published' : review.status === 'pending' ? 'Awaiting moderation' : review.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, width: '100%' },
  backButton: { marginRight: 10, padding: 5 },
  backButtonText: { fontSize: 24, color: '#333', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center', marginRight: 34 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 30 },
  starRow: { flexDirection: 'row' },
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 15, fontWeight: '600', color: '#333', flexShrink: 1, marginRight: 8 },
  reviewerName: { fontSize: 13, color: '#888', marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#555', marginTop: 2, lineHeight: 20 },
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  reviewDate: { fontSize: 12, color: '#999' },
  statusBadge: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  statusApproved: { color: '#1e7e34', backgroundColor: '#e6f6ea' },
  statusPending: { color: '#8a6d3b', backgroundColor: '#fdf3d7' },
});
export default FarmerReviews;

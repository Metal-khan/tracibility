import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Button } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '../services/secureStorage';
import api from '../services/api';
import Toast from 'react-native-toast-message';

// Define RootStackParamList for type safety
type RootStackParamList = {
  Login: undefined;
  FarmerProductList: undefined;
  FarmerProductDetails: { productId: string };
  FarmerProductEdit: { productId: string };
};

type FarmerProductDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FarmerProductDetails'>;
type FarmerProductDetailsScreenRouteProp = RouteProp<RootStackParamList, 'FarmerProductDetails'>;

const FarmerProductDetails: React.FC = () => {
  const navigation = useNavigation<FarmerProductDetailsScreenNavigationProp>();
  const route = useRoute<FarmerProductDetailsScreenRouteProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Not authenticated. Please log in.', position: 'bottom' });
          navigation.replace('Login');
          return;
        }

        const response = await api.get(`/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAuthToken(token);
        setProduct(response.data.product);
      } catch (err: any) {
        console.error('Failed to fetch product details:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load product details.');
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load product details. Please try again.', position: 'bottom' });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Product Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Back to List" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found.</Text>
        <Button title="Back to List" onPress={() => navigation.goBack()} />
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
          <Text style={styles.title}>Product Details</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 1: Basic Information</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Crop Type:</Text> {product.crop_type} (ID: {product.id})
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Variety:</Text> {product.variety || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Farmer:</Text> {product.farmer?.name || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Farm Name:</Text> {product.farm_name || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Contact Number:</Text> {product.contact_number || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Status:</Text> {product.status}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 2: Location Details</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Origin:</Text> {product.origin_location_address}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>GPS:</Text> ({product.origin_location_lat}, {product.origin_location_lon})
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Province:</Text> {product.province || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>District:</Text> {product.district || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Village:</Text> {product.village || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Land Area:</Text> {product.land_area || 'N/A'} {product.land_area_unit || 'N/A'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 3: Harvest & Yield</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Farming Method:</Text> {product.farming_method || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Season:</Text> {product.season || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Sowing Date:</Text> {product.sowing_date || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Harvest Date:</Text> {product.harvest_date || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Estimated Yield:</Text> {product.estimated_yield || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Actual Yield:</Text> {product.actual_yield || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Quality Grade:</Text> {product.quality_grade || 'N/A'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 4: Environmental</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Weather at Harvest:</Text> {product.weather_condition || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Temperature:</Text> {product.temperature || 'N/A'} °C
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Humidity:</Text> {product.humidity || 'N/A'} %
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 5: Post-Harvest Handling</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Collection Date:</Text> {product.collection_date || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Storage Method:</Text> {product.storage_method || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Packaging Type:</Text> {product.packaging_type || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>No. of Packages:</Text> {product.num_packages || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Weight per Unit:</Text> {product.weight_per_unit || 'N/A'} kg
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Total Weight:</Text> {product.total_weight || 'N/A'} kg
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Section 6: Media & Notes</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Special Remarks:</Text> {product.special_remarks || 'N/A'}
          </Text>
          {product.photos_urls_array && product.photos_urls_array.length > 0 && (
            <View style={styles.photosContainer}>
              <Text style={styles.sectionSubtitle}>Photos:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {product.photos_urls_array.map((photoUrl: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photoUrl, headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined }}
                    style={styles.productImage}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {product.dynamic_field_values && product.dynamic_field_values.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Section 7: Dynamic Fields</Text>
            {product.dynamic_field_values.map((dfValue: any) => (
              <Text key={dfValue.id} style={styles.detailText}>
                <Text style={styles.boldText}>{dfValue.dynamic_field?.name || 'Unknown Field'}:</Text> {dfValue.value}
              </Text>
            ))}
          </View>
        )}

        {product.reviews && product.reviews.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Section 8: Reviews</Text>
            <View style={styles.reviewList}>
              {product.reviews.map((review: any) => (
                <View key={review.id} style={styles.reviewCard}>
                  <Text style={styles.reviewText}>
                    <Text style={styles.boldText}>Buyer:</Text> {review.buyer?.name || 'N/A'}
                  </Text>
                  <Text style={styles.reviewText}>
                    <Text style={styles.boldText}>Rating:</Text> {review.rating} stars
                  </Text>
                  <Text style={styles.reviewText}>
                    <Text style={styles.boldText}>Comment:</Text> {review.comment || 'No comment'}
                  </Text>
                  <Text style={styles.reviewText}>
                    <Text style={styles.boldText}>Status:</Text> {review.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#cc0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    width: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  boldText: { // New style for bold text
    fontWeight: 'bold',
  },
  photosContainer: {
    marginTop: 15,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  photoScroll: {
    flexDirection: 'row',
    marginTop: 10,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    resizeMode: 'cover',
  },
  reviewList: {
    marginTop: 10,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
});

export default FarmerProductDetails;
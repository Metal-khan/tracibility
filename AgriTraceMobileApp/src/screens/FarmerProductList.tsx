import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Button, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '../services/secureStorage';
import api from '../services/api';
import Toast from 'react-native-toast-message';

// Define RootStackParamList for navigation type safety
type RootStackParamList = {
  Login: undefined;
  FarmerDashboard: undefined;
  FarmerProductList: undefined;
  FarmerProductDetails: { productId: string };
  ProductQRCode: { productId: string };
};

type FarmerProductListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FarmerProductList'>;

const FarmerProductList: React.FC = () => {
  const navigation = useNavigation<FarmerProductListScreenNavigationProp>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Not authenticated. Please log in.', position: 'bottom' });
        navigation.replace('Login');
        return;
      }

      const response = await api.get('/products/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // photos_urls_array now comes back as full authenticated URLs
      // already (see Product::getPhotosUrlsArrayAttribute on the backend),
      // so no path-prepending is needed here anymore.
      setAuthToken(token);
      setProducts(response.data);

    } catch (err: any) {
      console.error('Failed to fetch products:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load products.');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load products. Please try again later.', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation]);

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Text style={styles.productTitle}>{item.crop_type} (ID: {item.id})</Text>
      <Text style={styles.productInfo}>Quantity: {item.quantity} {item.unit}</Text>
      <Text style={styles.productInfo}>Harvest Date: {item.harvest_date}</Text>
      <Text style={styles.productInfo}>Status: {item.status}</Text>
      {item.photos_urls_array && item.photos_urls_array.length > 0 && (
        <Image
          source={{ uri: item.photos_urls_array[0], headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined }}
          style={styles.productImage}
        />
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('FarmerProductDetails', { productId: item.id.toString() })}>
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ProductQRCode', { productId: item.id.toString() })}>
          <Text style={styles.buttonText}>View QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading Products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={fetchProducts} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Products</Text>
      </View>

      {products.length === 0 ? (
        <Text style={styles.noProductsText}>No products added yet.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: '#28a745',
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
    backgroundColor: '#f0f9ff',
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
  noProductsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  productInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FarmerProductList;
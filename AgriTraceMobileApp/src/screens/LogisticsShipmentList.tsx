import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  LogisticsDashboard: undefined;
  LogisticsShipmentList: undefined;
  ProductInfoCategories: { productId: string };
};
type LogisticsShipmentListNavigationProp = StackNavigationProp<RootStackParamList, 'LogisticsShipmentList'>;

interface CheckpointItem {
  checkpoint_id: number;
  product_id: number;
  product_name: string;
  location_address: string;
  notes: string | null;
  scan_timestamp: string;
}

const LogisticsShipmentList: React.FC = () => {
  const navigation = useNavigation<LogisticsShipmentListNavigationProp>();
  const [checkpoints, setCheckpoints] = useState<CheckpointItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get('/history/logistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCheckpoints(response.data.history || []);
    } catch (err: any) {
      console.error('Failed to load shipment history:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Could not load shipments.', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
    const unsubscribe = navigation.addListener('focus', fetchShipments);
    return unsubscribe;
  }, [navigation, fetchShipments]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Shipments</Text>
      </View>
      <Text style={styles.subtitle}>Checkpoints you've logged while handling a shipment.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 30 }} />
      ) : checkpoints.length === 0 ? (
        <Text style={styles.emptyText}>You haven't logged any checkpoints yet.</Text>
      ) : (
        checkpoints.map((cp) => (
          <TouchableOpacity
            key={cp.checkpoint_id}
            style={styles.card}
            onPress={() => navigation.navigate('ProductInfoCategories', { productId: cp.product_id.toString() })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.productName}>{cp.product_name}</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#ccc" />
            </View>
            <View style={styles.row}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#666" />
              <Text style={styles.rowText}>{cp.location_address}</Text>
            </View>
            {!!cp.notes && cp.notes !== 'No notes provided.' && (
              <View style={styles.row}>
                <MaterialCommunityIcons name="note-text-outline" size={16} color="#666" />
                <Text style={styles.rowText}>{cp.notes}</Text>
              </View>
            )}
            <Text style={styles.date}>{new Date(cp.scan_timestamp).toLocaleString()}</Text>
          </TouchableOpacity>
        ))
      )}
      <Toast />
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
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rowText: { fontSize: 13, color: '#666', marginLeft: 6, flexShrink: 1 },
  date: { fontSize: 12, color: '#999', marginTop: 6 },
});
export default LogisticsShipmentList;

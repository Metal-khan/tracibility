import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = { FarmerDashboard: undefined; FarmerReviews: undefined; };
type FarmerReviewsNavigationProp = StackNavigationProp<RootStackParamList, 'FarmerReviews'>;

const FarmerReviews: React.FC = () => {
  const navigation = useNavigation<FarmerReviewsNavigationProp>();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Reviews</Text>
      </View>
      <Text style={styles.subtitle}>View reviews for your products.</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 50, paddingHorizontal: 20, alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%' },
  backButton: { marginRight: 10, padding: 5 },
  backButtonText: { fontSize: 24, color: '#333', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 20 },
});
export default FarmerReviews;
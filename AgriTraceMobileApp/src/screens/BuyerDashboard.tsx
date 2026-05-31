import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define RootStackParamList for type safety in navigation
type RootStackParamList = {
  Login: undefined;
  BuyerDashboard: undefined;
  ScanProduct: undefined;
  ScanHistory: undefined;
  FarmerReviews: undefined; // Used for a generic 'My Reviews'
  MyAccount: undefined;
};

type BuyerDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'BuyerDashboard'>;

const BuyerDashboard: React.FC = () => {
  const navigation = useNavigation<BuyerDashboardNavigationProp>();
  const userName = "Buyer User";
  const lastUpdate = "Last Update 25 Feb 2020";

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      navigation.replace('Login');
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: error.response?.data?.message || 'Could not log out. Please try again.',
        position: 'bottom',
        visibilityTime: 4000,
      });
    }
  };

  // Define menu items with icons and target screens
  const menuItems = [
    // Note: We use ScanProductScreen from the Logistics section, as the functionality is similar (QR scan)
    { name: "Scan Product", icon: "qrcode-scan", screen: "ScanProduct" },
    { name: "My Scan History", icon: "history", screen: "ScanHistory" },
    { name: "My Reviews", icon: "star-box-multiple-outline", screen: "FarmerReviews" }, 
    { name: "My Account", icon: "account-circle-outline", screen: "MyAccount" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.dashboardTitle}>Agritrace</Text>
              <Text style={styles.lastUpdateText}>{lastUpdate}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MyAccount')} style={styles.profileIconContainer}>
              <MaterialCommunityIcons name="account-circle" size={50} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.cardsContainer}>
          <FlatList
            data={menuItems}
            numColumns={2}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate(item.screen as any)}
              >
                <MaterialCommunityIcons name={item.icon as any} size={40} color="#28a745" />
                <Text style={styles.menuCardText}>{item.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
        <View style={styles.bottomSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  topSection: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    alignItems: 'flex-start',
    marginBottom: -60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  dashboardTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  profileIconContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: '#fff',
  },
  lastUpdateText: { fontSize: 14, color: '#d1e0fc', alignSelf: 'flex-start' },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  flatListContent: {
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: '#fff',
    width: '48%', aspectRatio: 1, borderRadius: 15, padding: 15,
    marginBottom: 15, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 5, elevation: 6,
    marginHorizontal: '1%',
  },
  menuCardText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10, textAlign: 'center' },
  bottomSection: {
    marginTop: 'auto',
    padding: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row', backgroundColor: '#dc2626',
    paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});

export default BuyerDashboard;
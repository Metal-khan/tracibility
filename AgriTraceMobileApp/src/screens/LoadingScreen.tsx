import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../services/api'; // Import your API service

// Define your root stackParamList types for type safety in navigation
type RootStackParamList = {
  Login: undefined;
  FarmerDashboard: undefined;
  BuyerDashboard: undefined;
  LogisticsDashboard: undefined;
  // Add other role-specific dashboards here
  Home: undefined; // Generic home screen
};

type LoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoadingScreen: React.FC = () => {
  const navigation = useNavigation<LoadingScreenNavigationProp>();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userRole = await AsyncStorage.getItem('userRole');

        if (userToken && userRole) {
          // Try to validate the token by making a quick API call
          try {
            // This is a simple authenticated endpoint to check token validity
            await api.get('/user', {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
            });
            // If the above call succeeds, token is valid. Proceed to dashboard.
            if (userRole === 'farmer') {
              navigation.replace('FarmerDashboard');
            } else if (userRole === 'buyer') {
              navigation.replace('BuyerDashboard');
            } else if (userRole === 'logistics') {
              navigation.replace('LogisticsDashboard');
            } else {
              navigation.replace('Home');
            }
          } catch (apiError: any) {
            // If API call fails (e.g., 401 Unauthorized), the token is invalid
            console.error("Token validation failed, logging out:", apiError.response?.data || apiError.message);
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            navigation.replace('Login'); // Go to login
          }
        } else {
          // No token found, navigate to Login
          navigation.replace('Login');
        }
      } catch (e) {
        // Error reading token/role from storage (e.g., AsyncStorage error)
        console.error("Failed to load token/role from storage", e);
        navigation.replace('Login');
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriTrace</Text>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingScreen;
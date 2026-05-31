import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp
import api from '../services/api';

// Define your root stackParamList types for type safety in navigation
type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    // Add other role-specific dashboards here if HomeScreen acts as a fallback for them too
    FarmerDashboard: undefined;
    BuyerDashboard: undefined;
    LogisticsDashboard: undefined;
};

// Define the type for navigation prop specific to HomeScreen
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>(); // Use the defined type

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        await api.post('/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      Alert.alert('Logged Out', 'You have been successfully logged out.');
      navigation.replace('Login'); // Use replace to clear navigation history
    } catch (error: any) {
      console.error('Logout error:', error.response?.data || error.message);
      Alert.alert('Logout Failed', 'Could not log out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to AgriTrace!</Text>
      <Text style={styles.subtitle}>Your mobile app dashboard.</Text>
      <Button title="Logout" onPress={handleLogout} />
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});

export default HomeScreen;
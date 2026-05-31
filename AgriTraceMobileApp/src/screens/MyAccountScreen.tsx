import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Toast from 'react-native-toast-message';

// Define RootStackParamList for type safety
type RootStackParamList = {
  Login: undefined;
  FarmerDashboard: undefined;
  MyAccount: undefined;
};

type MyAccountScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyAccount'>;

const MyAccountScreen: React.FC = () => {
  const navigation = useNavigation<MyAccountScreenNavigationProp>();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>(''); // Assuming this exists for farmers
  const [loading, setLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Not authenticated. Please log in.', position: 'bottom' });
        navigation.replace('Login');
        return;
      }

      const response = await api.get('/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setName(response.data.name);
      // Assuming a contact_number field is in the user model
      setContactNumber(response.data.contact_number || ''); 

    } catch (err: any) {
      console.error('Failed to fetch user data:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to load user details.');
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load user details. Please try again.', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Not authenticated. Please log in.', position: 'bottom' });
        navigation.replace('Login');
        return;
      }

      // Assuming an API endpoint exists for updating user profiles
      const response = await api.put(`/user/${user.id}`, { name, contact_number: contactNumber }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user);
      setName(response.data.user.name);
      setContactNumber(response.data.user.contact_number || '');

      Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!', position: 'bottom' });
    } catch (err: any) {
      console.error('Failed to update profile:', err.response?.data || err.message);
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err.response?.data?.message || 'Failed to update profile. Please try again.', position: 'bottom' });
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Account Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
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
          <Text style={styles.title}>My Account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Information</Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Email:</Text> {user?.email || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Role:</Text> {user?.role || 'N/A'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>Status:</Text> {user?.status || 'N/A'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Profile</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Contact Number</Text>
          <TextInput style={styles.input} value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={updateLoading}>
            {updateLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
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
  boldText: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  updateButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyAccountScreen;
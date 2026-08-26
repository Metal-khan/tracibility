import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons'; 

// Define your root stackParamList types for type safety in navigation
type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    FarmerDashboard: undefined;
    BuyerDashboard: undefined;
    LogisticsDashboard: undefined;
    Subscription: undefined; // CRITICAL: Added Subscription screen
};

// Define the type for navigation prop
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;


const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false); 
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        // Basic frontend validation
        if (!email.trim() || !password.trim()) {
             Toast.show({
                 type: 'error',
                 text1: 'Input Missing',
                 text2: 'Please enter both email and password.',
                 position: 'bottom',
                 visibilityTime: 3000,
             });
             return;
        }

        setLoading(true);
        try {
            const response = await api.post('/login', { email, password });
            const { user, token } = response.data;

            // Store token, role, and CRITICAL: Assume status is returned by the backend
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userRole', user.role);
            const userStatus = user.status; // Assuming the status field exists on the user object
            await AsyncStorage.setItem('userStatus', userStatus); 

            Toast.show({
                type: 'success',
                text1: 'Welcome!',
                text2: `Logged in as ${user.role}.`,
                position: 'bottom',
                visibilityTime: 3000,
            });

            // ----------------------------------------------------
            // CRITICAL REDIRECTION LOGIC: Check status for Farmers
            // ----------------------------------------------------
            if (user.role === 'farmer') {
                if (userStatus === 'approved' || userStatus === 'active') {
                    // Approved/Active Farmer goes straight to dashboard
                    navigation.replace('FarmerDashboard');
                } else if (userStatus === 'pending' || userStatus === 'inactive') {
                    // Pending/Inactive Farmer must go to subscription/activation screen
                    navigation.replace('Subscription');
                } else {
                    // Fallback for restricted status
                    Toast.show({type: 'error', text1: 'Account Restricted', text2: `Status: ${userStatus}. Contact admin.`, visibilityTime: 5000});
                    // Remove token to force re-login if access is completely denied
                    await AsyncStorage.removeItem('userToken'); 
                    navigation.replace('Login'); 
                }
            } else if (user.role === 'buyer') {
                // Buyer goes straight to dashboard
                navigation.replace('BuyerDashboard');
            } else if (user.role === 'logistics') {
                // Logistics goes straight to dashboard
                navigation.replace('LogisticsDashboard');
            } else {
                navigation.replace('Home');
            }

        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            
            let errorMessage = 'Invalid credentials or network error.';

            if (error.message === 'Network Error') {
                errorMessage = 'Connection failed. Check your API server and IP address.';
            } else {
                // Display the specific message from the server (e.g., 'Invalid credentials.')
                errorMessage = error.response?.data?.message || errorMessage;
            }

            Toast.show({
                type: 'error',
                text1: 'Login Failed',
                text2: errorMessage,
                position: 'bottom',
                visibilityTime: 4000,
            });

        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>AgriTrace Login</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                />
                <View style={styles.passwordInputContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword} 
                        editable={!loading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                        disabled={loading}
                    >
                        <MaterialIcons 
                            name={showPassword ? 'visibility' : 'visibility-off'} 
                            size={24} 
                            color="#888" 
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.registerLink}>Forgot your password?</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>Don't have an account? Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0f2f7',
    },
    card: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f8f8f8',
    },
    passwordInputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 20,
        backgroundColor: '#f8f8f8',
    },
    passwordInput: { 
        flex: 1, 
        padding: 15,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 12,
    },
    button: {
        backgroundColor: '#28a745',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerLink: {
        marginTop: 25,
        color: '#007bff',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});

export default LoginScreen;
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Used for role selection
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Define your root stackParamList types for type safety
type RootStackParamList = {
    Login: undefined;
    Register: undefined; 
};

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [role, setRole] = useState<string>('farmer'); // Default role: SME (Farmer)
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false); 

    // Role-specific fields (Used for Farmer and Logistics)
    const [farmName, setFarmName] = useState<string>(''); 
    const [contactNumber, setContactNumber] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>(''); // Logistics name placeholder
    const [contactInfo, setContactInfo] = useState<string>(''); // General contact info placeholder

    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const validateInputs = () => {
        if (!name || !email || !password || password.length < 8) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in Name, Email, and a password of at least 8 characters.', position: 'bottom' });
            return false;
        }
        if (role === 'farmer' && (!farmName || !contactNumber)) {
            Toast.show({ type: 'error', text1: 'Farmer Details Missing', text2: 'Farm/Company Name and Contact Number are required for SME registration.', position: 'bottom' });
            return false;
        }
        if (role === 'logistics' && (!companyName || !contactInfo)) {
            Toast.show({ type: 'error', text1: 'Logistics Details Missing', text2: 'Company Name and Contact Info are required for Logistics registration.', position: 'bottom' });
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateInputs()) return;

        setLoading(true);

        try {
            const payload: any = { 
                name, 
                email, 
                password, 
                role,
                status: (role === 'farmer' || role === 'logistics') ? 'pending' : 'approved' 
            };

            // Attach role-specific data to the payload
            if (role === 'farmer') {
                payload.farm_name = farmName;
                payload.contact_number = contactNumber;
            } else if (role === 'logistics') {
                payload.company_name = companyName;
                payload.contact_info = contactInfo;
            }
            // Buyer gets no extra required fields

            await api.post('/register', payload);

            Toast.show({
                type: 'success',
                text1: 'Registration Successful',
                text2: (role === 'farmer' || role === 'logistics') 
                    ? 'Account is pending approval/subscription. Please login.'
                    : 'Account created. Please login.',
                position: 'bottom',
                visibilityTime: 4000,
            });

            // Redirect to login
            navigation.replace('Login');

        } catch (error: any) {
            console.error('Registration error:', error.response?.data || error.message);
            
            const errorMessage = error.response?.data?.errors ? 
                                 Object.values(error.response.data.errors).flat().join('\n') : 
                                 (error.response?.data?.message || 'Registration failed. Please try again.');
                                 
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: errorMessage,
                position: 'bottom',
                visibilityTime: 5000,
            });

        } finally {
            setLoading(false);
        }
    };

    const renderRoleSpecificFields = () => {
        if (role === 'farmer') {
            return (
                <View style={styles.roleFieldsContainer}>
                    <Text style={styles.fieldSectionTitle}><MaterialCommunityIcons name="barn" size={16} /> SME/Farmer Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Farm / Company Name (Required)"
                        placeholderTextColor="#888"
                        value={farmName}
                        onChangeText={setFarmName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contact Number (Required)"
                        placeholderTextColor="#888"
                        value={contactNumber}
                        onChangeText={setContactNumber}
                        keyboardType="phone-pad"
                    />
                </View>
            );
        }
        if (role === 'logistics') {
            return (
                 <View style={styles.roleFieldsContainer}>
                    <Text style={styles.fieldSectionTitle}><MaterialCommunityIcons name="truck-fast" size={16} /> Logistics Details</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Company Name (Required)"
                        placeholderTextColor="#888"
                        value={companyName}
                        onChangeText={setCompanyName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contact Info / Address (Required)"
                        placeholderTextColor="#888"
                        value={contactInfo}
                        onChangeText={setContactInfo}
                        multiline
                    />
                </View>
            );
        }
        return (
            <View style={styles.roleFieldsContainer}>
                 <Text style={styles.fieldSectionTitle}><MaterialCommunityIcons name="shopping" size={16} /> Buyer (End User)</Text>
                 <Text style={styles.buyerInfoText}>You will receive instant access upon registration.</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.title}>Create Account</Text>

                    {/* Role Picker */}
                    <View style={styles.pickerContainer}>
                        <Text style={styles.label}>Select Account Type:</Text>
                        <Picker
                            selectedValue={role}
                            style={styles.picker}
                            onValueChange={(itemValue) => {
                                setRole(itemValue as string);
                                setFarmName(''); setContactNumber(''); 
                                setCompanyName(''); setContactInfo('');
                            }}
                        >
                            <Picker.Item label="SME / Farmer" value="farmer" />
                            <Picker.Item label="Logistics" value="logistics" />
                            <Picker.Item label="Buyer (End User)" value="buyer" />
                        </Picker>
                    </View>

                    <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                    {/* Password Input with Eye Icon */}
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Password (Min 8 characters)"
                            placeholderTextColor="#888"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <MaterialIcons 
                                name={showPassword ? 'visibility' : 'visibility-off'} 
                                size={24} 
                                color="#888" 
                            />
                        </TouchableOpacity>
                    </View>

                    {renderRoleSpecificFields()}

                    <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Register Account</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#e0f2f7' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    card: {
        width: '90%', maxWidth: 450, backgroundColor: '#fff',
        borderRadius: 15, padding: 30, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
    },
    title: { fontSize: 30, fontWeight: 'bold', marginBottom: 30, color: '#2c3e50' },
    
    // Role Picker Styles
    label: { fontSize: 16, marginBottom: 8, color: '#555', width: '100%', textAlign: 'left' },
    pickerContainer: {
        width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#ccc',
        borderRadius: 10, backgroundColor: '#f8f8f8', overflow: 'hidden',
    },
    picker: { height: 50, width: '100%' },

    // Role-Specific Field Styles
    roleFieldsContainer: { 
        width: '100%', 
        paddingVertical: 15, 
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#007bff'
    },
    fieldSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2c3e50',
    },
    buyerInfoText: {
        fontSize: 14,
        color: '#28a745',
        marginTop: 5,
    },
    
    // General Input Styles
    input: {
        width: '100%', padding: 15, borderWidth: 1, borderColor: '#ccc',
        borderRadius: 10, marginBottom: 20, fontSize: 16, color: '#333', backgroundColor: '#fff',
    },
    passwordInputContainer: {
        width: '100%', flexDirection: 'row', alignItems: 'center', borderWidth: 1,
        borderColor: '#ccc', borderRadius: 10, marginBottom: 20, backgroundColor: '#f8f8f8',
    },
    passwordInput: { flex: 1, padding: 15, fontSize: 16, color: '#333' },
    eyeIcon: { padding: 12 },
    button: {
        backgroundColor: '#28a745', width: '100%', padding: 15,
        borderRadius: 10, alignItems: 'center', marginTop: 10,
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loginLink: { marginTop: 25, color: '#007bff', fontSize: 16, textDecorationLine: 'underline' },
});

export default RegisterScreen;
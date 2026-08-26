import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
    Login: undefined;
    ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
    const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

    // Step 1: request a code. Step 2: enter the code + a new password.
    const [step, setStep] = useState<1 | 2>(1);

    const [email, setEmail] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleRequestCode = async () => {
        if (!email.trim()) {
            Toast.show({ type: 'error', text1: 'Email Required', text2: 'Enter the email on your account.', position: 'bottom' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/forgot-password', { email: email.trim() });
            Toast.show({
                type: 'success',
                text1: 'Check Your Email',
                text2: 'If an account exists for that email, a reset code was sent.',
                position: 'bottom',
                visibilityTime: 5000,
            });
            setStep(2);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Could not request a reset code. Please try again.';
            Toast.show({ type: 'error', text1: 'Request Failed', text2: message, position: 'bottom' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!code.trim() || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Fill in the code and your new password.', position: 'bottom' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Passwords Don\'t Match', text2: 'Check your new password and confirmation.', position: 'bottom' });
            return;
        }
        if (newPassword.length < 8) {
            Toast.show({ type: 'error', text1: 'Password Too Short', text2: 'Use at least 8 characters.', position: 'bottom' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                email: email.trim(),
                token: code.trim(),
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            Toast.show({
                type: 'success',
                text1: 'Password Reset',
                text2: 'Please log in with your new password.',
                position: 'bottom',
                visibilityTime: 4000,
            });
            navigation.replace('Login');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Could not reset the password. Please check the code and try again.';
            Toast.show({ type: 'error', text1: 'Reset Failed', text2: message, position: 'bottom' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Reset Password</Text>

                {step === 1 ? (
                    <>
                        <Text style={styles.subtitle}>
                            Enter your account email and we'll send you a reset code.
                        </Text>
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
                        <TouchableOpacity style={styles.button} onPress={handleRequestCode} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            Enter the code we sent to {email}, and your new password.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Reset Code"
                            placeholderTextColor="#888"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="none"
                            editable={!loading}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#888"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#888"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!loading}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} disabled={loading}>
                            <Text style={styles.linkText}>Didn't get a code? Send again</Text>
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity onPress={() => navigation.replace('Login')} disabled={loading}>
                    <Text style={styles.linkText}>Back to Login</Text>
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
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        width: '100%',
        padding: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f8f8f8',
    },
    button: {
        backgroundColor: '#28a745',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkText: {
        marginTop: 20,
        color: '#007bff',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
});

export default ForgotPasswordScreen;

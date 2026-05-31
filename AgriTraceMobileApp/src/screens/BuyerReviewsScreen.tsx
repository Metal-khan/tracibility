// src/screens/BuyerReviewsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type RootStackParamList = {
    BuyerReviewsScreen: { productId: string };
};
type BuyerReviewsRouteProp = RouteProp<RootStackParamList, 'BuyerReviewsScreen'>;

const BuyerReviewsScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<BuyerReviewsRouteProp>();
    const { productId } = route.params;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.title}>Reviews & Ratings</Text>
                <Button title="Back" onPress={() => navigation.goBack()} />
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.subtitle}>Product ID: {productId}</Text>
                <Text style={styles.text}>
                    This screen will show existing customer reviews and provide the form to submit a new rating.
                    It replaces the 'Leave a Review' card from the previous design.
                </Text>
                {/* Placeholder for Review Form and List */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9f9' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, marginBottom: 15, color: '#666' },
    container: { padding: 20 },
    text: { fontSize: 16, color: '#444' }
});

export default BuyerReviewsScreen;
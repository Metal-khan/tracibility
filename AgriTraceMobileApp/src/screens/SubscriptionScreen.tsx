import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '../services/secureStorage';
import api from '../services/api';

// Get screen width for carousel styling
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const SPACING = 20;

type RootStackParamList = {
    Login: undefined;
    Subscription: undefined;
    FarmerDashboard: undefined;
};

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

const SubscriptionScreen: React.FC = () => {
    const navigation = useNavigation<SubscriptionScreenNavigationProp>();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('Loading account status...');
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null); 
    
    // Animation Refs for horizontal scrolling
    const scrollX = useRef(new Animated.Value(0)).current;

    const plans = [
        { id: 'FREE_TRIAL_3', name: 'Free Trial', price: 0.00, products: 3 as number | string, icon: 'account-star-outline', color: '#007bff' },
        { id: 'BASIC_5', name: '5 Product Pack', price: 49.99, products: 5 as number | string, icon: 'numeric-5-box-outline', color: '#28a745' },
        { id: 'STANDARD_10', name: '10 Product Pack', price: 89.99, products: 10 as number | string, icon: 'numeric-10-box-outline', color: '#ffc107' },
        { id: 'PREMIUM_25', name: '25 Product Pack', price: 199.99, products: 25 as number | string, icon: 'numeric-9-plus-box-outline', color: '#dc3545' },
        { id: 'UNLIMITED', name: 'Unlimited Annual', price: 499.99, products: 'Unlimited' as number | string, icon: 'infinity', color: '#800080' },
    ];
    
    const isPlanCurrent = (planId: string) => planId === currentPlanId;

    // --- Data Fetching ---
    const fetchCurrentSubscription = async () => {
        setFetchLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return navigation.replace('Login');

            const response = await api.get('/user', { headers: { Authorization: `Bearer ${token}` } });
            const plan = response.data.subscription_plan;
            const status = response.data.status;

            setCurrentPlanId(plan);

            if (status === 'approved' || status === 'active') {
                setStatusMessage(`Account is active. Your current plan is ${plan || 'N/A'}.`);
            } else {
                 setStatusMessage('Welcome! Choose a product pack to activate your account.');
            }

        } catch (error) {
             setStatusMessage('Could not load account status. Please try again.');
        } finally {
            setFetchLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentSubscription();
    }, []);
    // -----------------------------------------------------


    const handleSubscription = async () => {
        if (!selectedPlan || isPlanCurrent(selectedPlan)) return;

        setLoading(true);
        const planDetails = plans.find(p => p.id === selectedPlan);
        
        let productsCount: number;
        if (planDetails?.products === 'Unlimited') {
            productsCount = 9999;
        } else if (typeof planDetails?.products === 'number') {
            productsCount = planDetails.products;
        } else {
             productsCount = 0;
        }
        
        const isFreePlan = planDetails?.price === 0.00;

        setStatusMessage(isFreePlan ? 'Activating free trial...' : 'Processing payment...');

        try {
            const token = await AsyncStorage.getItem('userToken');
            
            if (!isFreePlan) {
                await new Promise(resolve => setTimeout(resolve, 1500)); 
            }
            
            await api.post('/update-subscription', {
                plan_id: selectedPlan,
                products_count: productsCount,
                payment_successful: true, 
                status: 'approved',
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await AsyncStorage.setItem('userStatus', 'approved');
            setCurrentPlanId(selectedPlan); 

            Toast.show({ 
                type: 'success', 
                text1: 'Success!', 
                text2: isFreePlan ? 'Trial activated. Start tracking!' : 'Subscription purchased and activated.', 
                visibilityTime: 4000 
            });

            navigation.replace('FarmerDashboard');

        } catch (error: any) {
            console.error('Subscription error:', error.response?.data || error.message);
            setStatusMessage('Failed to activate subscription. Try again.');
            Toast.show({ 
                type: 'error', 
                text1: 'Activation Failed', 
                text2: error.response?.data?.message || 'Could not complete subscription.', 
            });
        } finally {
            setLoading(false);
        }
    };

    // Render logic for each plan card
    const renderPlanCard = ({ item: plan, index }: { item: typeof plans[0], index: number }) => {
        const isCurrent = isPlanCurrent(plan.id);
        const isSelected = selectedPlan === plan.id;
        const color = plan.color;

        // Animate scale based on scroll position
        const inputRange = [
            (index - 1) * CARD_WIDTH,
            index * CARD_WIDTH,
            (index + 1) * CARD_WIDTH,
        ];

        const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.95, 1.05, 0.95], // Selected card scales up slightly
            extrapolate: 'clamp',
        });

        return (
            <Animated.View style={[{ transform: [{ scale }] }, styles.cardWrapper]}>
                <TouchableOpacity
                    key={plan.id}
                    style={[
                        styles.planCard, 
                        {borderColor: color}, 
                        (isSelected || isCurrent) && {backgroundColor: color},
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    disabled={loading || isCurrent}
                >
                    {isCurrent && (
                        <View style={[styles.badge, {backgroundColor: color}]}>
                            <Text style={styles.badgeText}>ACTIVE</Text>
                        </View>
                    )}
                    
                    <MaterialCommunityIcons 
                        name={plan.icon as any} 
                        size={55} 
                        color={isSelected || isCurrent ? '#fff' : color} 
                    />
                    
                    <Text style={[styles.planName, (isSelected || isCurrent) && styles.selectedText]}>{plan.name}</Text>
                    
                    <Text style={[styles.planPrice, (isSelected || isCurrent) && styles.selectedText]}>
                        {plan.price === 0.00 ? 'FREE' : `$${plan.price.toFixed(2)}`}
                    </Text>
                    
                    <Text style={[styles.planProducts, (isSelected || isCurrent) && styles.selectedText]}>
                        {plan.products} Products Quota
                    </Text>
                    
                    {isSelected && (
                         <MaterialCommunityIcons name="check-circle" size={25} color="#fff" style={styles.checkIcon} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Determine button text based on selection
    const buttonText = () => {
        if (fetchLoading) return 'Loading...';
        if (!selectedPlan) return 'Select a Plan';
        if (isPlanCurrent(selectedPlan)) return 'Plan Already Active';
        if (plans.find(p => p.id === selectedPlan)?.price === 0.00) return 'Activate Free Plan';
        return 'Proceed to Payment';
    };

    if (fetchLoading) {
         return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.infoText}>{statusMessage}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Choose Your Product Pack</Text>
            </View>
            
            {/* Scrollable Plan Carousel */}
            <View style={styles.carouselContainer}>
                <Animated.FlatList
                    data={plans}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate={0.999}
                    snapToInterval={CARD_WIDTH + SPACING}
                    contentContainerStyle={styles.flatListContent}
                    renderItem={renderPlanCard}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            </View>
            
            {/* Fixed Action Area */}
            <View style={styles.actionArea}>
                <Text style={styles.infoTextAction}>
                    {selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : 'Swipe to view available plans.'}
                </Text>
                
                <TouchableOpacity 
                    style={[
                        styles.proceedButton, 
                        (!selectedPlan || isPlanCurrent(selectedPlan)) && styles.disabledButton,
                        selectedPlan && !isPlanCurrent(selectedPlan) && {backgroundColor: plans.find(p => p.id === selectedPlan)?.color || '#2563eb'}
                    ]} 
                    onPress={handleSubscription} 
                    disabled={loading || !selectedPlan || isPlanCurrent(selectedPlan)}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.proceedButtonText}>
                            {buttonText()}
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.supportText}>
                    * Note: Payment is simulated for development purposes.
                </Text>
            </View>
            
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f9ff' },
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff', padding: 20},
    header: { 
        padding: 15, 
        backgroundColor: '#2563eb', 
        alignItems: 'center', 
        borderBottomLeftRadius: 25, 
        borderBottomRightRadius: 25,
        marginBottom: 20,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    infoText: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
    infoTextAction: { fontSize: 16, color: '#2c3e50', fontWeight: '600', marginBottom: 15, textAlign: 'center' },
    
    // --- Carousel Styles ---
    carouselContainer: {
        height: 350, // Fixed height for the carousel area
        justifyContent: 'center',
        alignItems: 'center',
    },
    flatListContent: {
        alignItems: 'center',
        paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2, // Center the first card
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: 300,
        marginHorizontal: SPACING / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    planCard: {
        backgroundColor: '#fff',
        width: '100%',
        height: '100%',
        padding: 25,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 4, 
        borderColor: '#eee',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
    },
    badge: {
        position: 'absolute',
        top: 15,
        left: -5,
        transform: [{ rotate: '-10deg' }],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 5,
        zIndex: 10,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkIcon: {
        position: 'absolute',
        bottom: 15,
        right: 15,
    },
    // --- Card Text Styles ---
    planName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
    planPrice: { fontSize: 36, fontWeight: '900', color: '#2563eb', marginVertical: 10 },
    planProducts: { fontSize: 16, color: '#666', fontWeight: '500' },
    selectedText: { color: '#fff' },


    // --- Action Area Styles ---
    actionArea: {
        marginTop: 'auto',
        padding: 20,
        width: '100%',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
    },
    proceedButton: {
        backgroundColor: '#ffc107', 
        paddingVertical: 18, 
        borderRadius: 12, 
        width: '90%',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    proceedButtonText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    supportText: { fontSize: 12, color: '#999', marginTop: 15, textAlign: 'center' },
});

export default SubscriptionScreen;
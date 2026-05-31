// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import core screens
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen'; 

// Import role-specific dashboards
import FarmerDashboard from '../screens/FarmerDashboard';
import BuyerDashboard from '../screens/BuyerDashboard'; 
import LogisticsDashboard from '../screens/LogisticsDashboard';

// Import General/Account screens
import MyAccountScreen from '../screens/MyAccountScreen';

// Import Farmer-specific feature screens
import ProductEntryScreen from '../screens/ProductEntryScreen';
import ProductQRCodeScreen from '../screens/ProductQRCodeScreen';
import FarmerProductList from '../screens/FarmerProductList';
import FarmerProductDetails from '../screens/FarmerProductDetails';
import FarmerProductEdit from '../screens/FarmerProductEdit';
import SubscriptionManagement from '../screens/SubscriptionManagement';
import ScanHistory from '../screens/ScanHistory';
import FarmerReviews from '../screens/FarmerReviews';

// Import Logistics/Buyer shared screens
import ScanProductScreen from '../screens/ScanProductScreen';
import LogisticsShipmentList from '../screens/LogisticsShipmentList';

// NEW BUYER TRACEABILITY SCREENS (Category Flow)
import ProductInfoCategories from '../screens/ProductInfoCategories'; 
import CategoryDetailScreen from '../screens/CategoryDetailScreen'; 
import BuyerReviewsScreen from '../screens/BuyerReviewsScreen'; 
import ProductCompanyProfile from '../screens/ProductCompanyProfile'; 

// Subscription Screens (NEW)
import SubscriptionScreen from '../screens/SubscriptionScreen';


const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading">
        {/* ======================= Core App Screens ======================= */}
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} /> 

        {/* ====================== Role-specific Dashboards & Subscription ====================== */}
        <Stack.Screen name="FarmerDashboard" component={FarmerDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="BuyerDashboard" component={BuyerDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="LogisticsDashboard" component={LogisticsDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: false }} />

        {/* ===================== Shared / Account Features ===================== */}
        <Stack.Screen name="MyAccount" component={MyAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScanHistory" component={ScanHistory} options={{ headerShown: false }} />
        
        {/* ===================== Logistics/Buyer Scan Flow (NEW CATEGORIES) ===================== */}
        <Stack.Screen name="ScanProduct" component={ScanProductScreen} options={{ headerShown: false }} />
        
        {/* NEW CATEGORY-BASED TRACE SCREENS */}
        <Stack.Screen name="ProductInfoCategories" component={ProductInfoCategories} options={{ headerShown: false }} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BuyerReviewsScreen" component={BuyerReviewsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductCompanyProfile" component={ProductCompanyProfile} options={{ headerShown: false }} />

        {/* Unused/Legacy Screen (If kept for reference, ensure it's commented out correctly) */}
        {/* <Stack.Screen name="BuyerProductDetails" component={BuyerProductDetails} options={{ headerShown: false }} /> */}
        
        <Stack.Screen name="LogisticsShipmentList" component={LogisticsShipmentList} options={{ headerShown: false }} />

        {/* ====================== Farmer-Specific Features ====================== */}
        <Stack.Screen name="ProductEntry" component={ProductEntryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductQRCode" component={ProductQRCodeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FarmerProductList" component={FarmerProductList} options={{ headerShown: false }} />
        <Stack.Screen name="FarmerProductDetails" component={FarmerProductDetails} options={{ headerShown: false }} />
        <Stack.Screen name="FarmerProductEdit" component={FarmerProductEdit} options={{ headerShown: false }} />
        <Stack.Screen name="SubscriptionManagement" component={SubscriptionManagement} options={{ headerShown: false }} />
        <Stack.Screen name="FarmerReviews" component={FarmerReviews} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
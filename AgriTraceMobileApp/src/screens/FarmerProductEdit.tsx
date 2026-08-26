import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

// Define RootStackParamList for navigation type safety
type RootStackParamList = {
  Login: undefined;
  FarmerProductList: undefined;
  FarmerProductEdit: { productId: string };
};

type FarmerProductEditScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FarmerProductEdit'>;
type FarmerProductEditScreenRouteProp = RouteProp<RootStackParamList, 'FarmerProductEdit'>;

// Define types for Dynamic Field structure (same as ProductEntryScreen)
interface DynamicFieldDefinition {
  id: number;
  name: string;
  field_type: string;
  is_required: boolean;
  default_value?: string;
  selection_options?: string[];
  is_general: boolean;
  crop_types?: { crop_type: string }[];
}

const FarmerProductEdit: React.FC = () => {
  const navigation = useNavigation<FarmerProductEditScreenNavigationProp>();
  const route = useRoute<FarmerProductEditScreenRouteProp>();
  const { productId } = route.params;

  // Product State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields (pre-populated from product state)
  const [cropType, setCropType] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [productPhotos, setProductPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]); // New photos to upload
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]); // URLs of existing photos

  const [originLat, setOriginLat] = useState<string>('');
  const [originLon, setOriginLon] = useState<string>('');
  const [originAddress, setOriginAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState<boolean>(false); // No auto-capture on edit load

  // Dynamic Fields State
  const [allDynamicFieldDefs, setAllDynamicFieldDefs] = useState<DynamicFieldDefinition[]>([]);
  const [filteredDynamicFields, setFilteredDynamicFields] = useState<DynamicFieldDefinition[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<{[key: string]: any}>({});
  const [dynamicFieldsLoading, setDynamicFieldsLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch product details and dynamic field definitions
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Not authenticated. Please log in.', position: 'bottom' });
          navigation.replace('Login');
          return;
        }

        // Fetch product details
        const productResponse = await api.get(`/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedProduct = productResponse.data.product;
        setProduct(fetchedProduct);

        // Populate form fields
        setCropType(fetchedProduct.crop_type);
        setQuantity(fetchedProduct.quantity.toString());
        setUnit(fetchedProduct.unit);
        setHarvestDate(new Date(fetchedProduct.harvest_date));
        setDescription(fetchedProduct.description || '');
        setExistingPhotoUrls(fetchedProduct.photos_urls_array || []);
        setOriginLat(fetchedProduct.origin_location_lat);
        setOriginLon(fetchedProduct.origin_location_lon);
        setOriginAddress(fetchedProduct.origin_location_address);

        // Fetch dynamic field definitions
        const dynamicFieldsResponse = await api.get('/admin/dynamic-fields', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllDynamicFieldDefs(dynamicFieldsResponse.data);

        // Populate dynamic field values from fetched product
        const initialDynamicValues: {[key: string]: any} = {};
        fetchedProduct.dynamic_field_values.forEach((dfValue: any) => {
            initialDynamicValues[dfValue.dynamic_field_id.toString()] = dfValue.value;
        });
        setDynamicFieldValues(initialDynamicValues);

      } catch (err: any) {
        console.error('Failed to fetch data for edit:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load product for editing.');
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load product for editing.', position: 'bottom' });
      } finally {
        setLoading(false);
        setDynamicFieldsLoading(false); // Dynamic fields definitions are also loaded
      }
    };

    fetchData();
    // Request permissions for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission', text2: 'Camera roll access needed for photos!', position: 'bottom' });
        }
      }
    })();
  }, [productId, navigation]);

  useEffect(() => {
    // Filter dynamic fields whenever cropType changes or allDynamicFieldDefs are loaded
    if (allDynamicFieldDefs.length > 0 && product) { // Ensure product is loaded
      const filtered = allDynamicFieldDefs.filter(def => {
        return def.is_general || (def.crop_types && def.crop_types.some(ct => ct.crop_type === cropType));
      });
      setFilteredDynamicFields(filtered);
    }
  }, [cropType, allDynamicFieldDefs, product]);


  const getLiveLocation = async () => {
    setLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location access denied.', position: 'bottom' });
      setLocationLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setOriginLat(location.coords.latitude.toString());
      setOriginLon(location.coords.longitude.toString());
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode.length > 0) {
        const address = geocode[0];
        setOriginAddress(`${address.name || ''}, ${address.street || ''}, ${address.city || ''}, ${address.country || ''}`);
      } else {
        setOriginAddress('Address not found for these coordinates.');
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get current location automatically. Please check GPS settings.', position: 'bottom' });
      setOriginLat(''); setOriginLon(''); setOriginAddress('');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setProductPhotos(prevPhotos => [...prevPhotos, ...result.assets]);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || harvestDate;
    setShowDatePicker(Platform.OS === 'ios');
    setHarvestDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleDynamicFieldChange = (fieldId: number, value: any, fieldType: string) => {
    let processedValue = value;
    if (fieldType === 'Boolean') {
        processedValue = value === 'true';
    } else if (fieldType === 'Number') {
        processedValue = parseFloat(value);
        if (isNaN(processedValue)) processedValue = '';
    } else if (fieldType === 'Multi-select' && typeof value === 'string') {
        processedValue = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    setDynamicFieldValues(prev => ({ ...prev, [fieldId]: processedValue }));
  };

  const handleSubmit = async () => {
    if (!cropType || !quantity || !unit || !harvestDate || !originLat || !originLon || !originAddress) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill all mandatory core fields.', position: 'bottom' });
      return;
    }

    // Validate required dynamic fields
    for (const fieldDef of filteredDynamicFields) {
        if (fieldDef.is_required) {
            const value = dynamicFieldValues[fieldDef.id.toString()];
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                Toast.show({ type: 'error', text1: 'Validation Error', text2: `"${fieldDef.name}" is required.`, position: 'bottom' });
                return;
            }
        }
    }

    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('crop_type', cropType);
    formData.append('quantity', quantity);
    formData.append('unit', unit);
    formData.append('harvest_date', harvestDate.toISOString().split('T')[0]);
    formData.append('description', description);
    formData.append('origin_location_lat', originLat);
    formData.append('origin_location_lon', originLon);
    formData.append('origin_location_address', originAddress);

    // Append new photos
    productPhotos.forEach((photo, index) => {
      const uriParts = photo.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('photos[]', {
        uri: photo.uri,
        name: `new_photo_${index}.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    });

    // Append dynamic field values
    formData.append('dynamic_fields', JSON.stringify(dynamicFieldValues));

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not authenticated.', position: 'bottom' });
        navigation.replace('Login');
        return;
      }

      const response = await api.post(`/products/${productId}`, formData, { // Use POST for update with files
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Toast.show({ type: 'success', text1: 'Success', text2: response.data.message, position: 'bottom' });
      navigation.goBack(); // Go back to product list

    } catch (error: any) {
      console.error('Product Edit Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.errors ?
                            Object.values(error.response.data.errors).flat().join('\n') :
                            (error.response?.data?.message || 'Failed to update product.');
      Toast.show({ type: 'error', text1: 'Update Failed', text2: errorMessage, position: 'bottom' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Product for Edit...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Back to List" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found for editing.</Text>
        <Button title="Back to List" onPress={() => navigation.goBack()} />
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
          <Text style={styles.title}>Edit Product</Text>
        </View>

        <Text style={styles.sectionTitle}>Core Product Details</Text>
        <TextInput style={styles.input} placeholder="Crop Type (e.g., Wheat)" placeholderTextColor="#888" value={cropType} onChangeText={setCropType} />
        <TextInput 
          style={styles.input} 
          placeholder="Quantity" 
          placeholderTextColor="#888"
          value={quantity} 
          onChangeText={setQuantity} 
          keyboardType="numeric"
        />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={unit} style={styles.picker} onValueChange={(itemValue) => setUnit(itemValue)}>
            <Picker.Item label="kg" value="kg" />
            <Picker.Item label="tons" value="tons" />
            <Picker.Item label="grams" value="grams" />
            <Picker.Item label="liters" value="liters" />
          </Picker>
        </View>

        {/* Harvest Date Picker */}
        <TouchableOpacity onPress={showDatepicker} style={styles.input}>
            <Text style={styles.datePickerText}>{harvestDate.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>
        {showDatePicker && (
            <DateTimePicker
                testID="dateTimePicker"
                value={harvestDate}
                mode="date"
                display="default"
                onChange={onChangeDate}
            />
        )}

        <TextInput style={styles.input} placeholder="Description (Optional)" placeholderTextColor="#888" value={description} onChangeText={setDescription} multiline numberOfLines={3} />

        <Text style={styles.sectionTitle}>Origin Location</Text>
        {locationLoading ? (
            <ActivityIndicator size="small" color="#2563eb" style={styles.locationLoadingIndicator} />
        ) : (
            <>
                <View style={styles.locationContainer}>
                    <TextInput style={styles.halfInput} placeholder="Latitude" placeholderTextColor="#888" value={originLat} editable={false} />
                    <TextInput style={styles.halfInput} placeholder="Longitude" placeholderTextColor="#888" value={originLon} editable={false} />
                </View>
                <TextInput style={styles.input} placeholder="Address" placeholderTextColor="#888" value={originAddress} multiline numberOfLines={2} editable={false} />
                <Button title="Recapture Location" onPress={getLiveLocation} />
            </>
        )}


        <Text style={styles.sectionTitle}>Product Photos</Text>
        {existingPhotoUrls.length > 0 && (
            <View style={styles.imagePreviewContainer}>
                <Text style={styles.label}>Existing Photos:</Text>
                {existingPhotoUrls.map((photoUrl, index) => (
                    <Image key={`existing-${index}`} source={{ uri: photoUrl }} style={styles.imagePreview} />
                ))}
            </View>
        )}
        <Button title="Pick New Images from Gallery" onPress={pickImage} />
        {productPhotos.length > 0 && (
            <View style={styles.imagePreviewContainer}>
                <Text style={styles.label}>New Photos to Upload:</Text>
                {productPhotos.map((photo, index) => (
                    <Image key={`new-${index}`} source={{ uri: photo.uri }} style={styles.imagePreview} />
                ))}
            </View>
        )}

        {/* Dynamic Fields Section */}
        <Text style={styles.sectionTitle}>Dynamic Fields (Optional)</Text>
        {dynamicFieldsLoading ? (
            <ActivityIndicator size="small" color="#2563eb" style={styles.locationLoadingIndicator} />
        ) : filteredDynamicFields.length === 0 ? (
            <Text style={styles.infoText}>No dynamic fields configured for this crop type, or none available.</Text>
        ) : (
            filteredDynamicFields.map(fieldDef => (
                <View key={fieldDef.id} style={styles.dynamicFieldItem}>
                    <Text style={styles.label}>{fieldDef.name} {fieldDef.is_required && <Text style={styles.requiredText}>*</Text>}</Text>
                    {fieldDef.field_type === 'Text' && (
                        <TextInput
                            style={styles.input}
                            placeholder={fieldDef.name}
                            placeholderTextColor="#888"
                            value={dynamicFieldValues[fieldDef.id.toString()]}
                            onChangeText={(text) => handleDynamicFieldChange(fieldDef.id, text, fieldDef.field_type)}
                        />
                    )}
                    {fieldDef.field_type === 'Number' && (
                        <TextInput
                            style={styles.input}
                            placeholder={fieldDef.name}
                            placeholderTextColor="#888"
                            value={dynamicFieldValues[fieldDef.id.toString()]?.toString()}
                            onChangeText={(text) => handleDynamicFieldChange(fieldDef.id, text, fieldDef.field_type)}
                            keyboardType="numeric"
                        />
                    )}
                    {fieldDef.field_type === 'Date' && (
                        <TouchableOpacity style={styles.input} onPress={() => { /* Open date picker for dynamic field */ Alert.alert('Date Picker', 'Dynamic Date Picker Coming Soon'); }}>
                            <Text style={styles.datePickerText}>{dynamicFieldValues[fieldDef.id.toString()] || 'Select Date'}</Text>
                        </TouchableOpacity>
                    )}
                    {fieldDef.field_type === 'Boolean' && (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={dynamicFieldValues[fieldDef.id.toString()]?.toString()}
                                style={styles.picker}
                                onValueChange={(itemValue) => handleDynamicFieldChange(fieldDef.id, itemValue, fieldDef.field_type)}
                            >
                                <Picker.Item label="True" value="true" />
                                <Picker.Item label="False" value="false" />
                            </Picker>
                        </View>
                    )}
                    {fieldDef.field_type === 'Dropdown' && fieldDef.selection_options && (
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={dynamicFieldValues[fieldDef.id.toString()]}
                                style={styles.picker}
                                onValueChange={(itemValue) => handleDynamicFieldChange(fieldDef.id, itemValue, fieldDef.field_type)}
                            >
                                {fieldDef.selection_options.map((option, idx) => (
                                    <Picker.Item key={idx} label={option} value={option} />
                                ))}
                            </Picker>
                        </View>
                    )}
                    {fieldDef.field_type === 'Multi-select' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Comma-separated values (e.g., A, B)"
                            placeholderTextColor="#888"
                            value={Array.isArray(dynamicFieldValues[fieldDef.id.toString()]) ? dynamicFieldValues[fieldDef.id.toString()].join(', ') : dynamicFieldValues[fieldDef.id.toString()]}
                            onChangeText={(text) => handleDynamicFieldChange(fieldDef.id, text, fieldDef.field_type)}
                            multiline
                        />
                    )}
                </View>
            ))
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitLoading}>
          {submitLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Product</Text>
          )}
        </TouchableOpacity>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
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
  // --- NEW/MISSING STYLE START ---
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#444',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  // --- NEW/MISSING STYLE END ---
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
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  locationLoadingIndicator: {
    marginBottom: 15,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 15,
    justifyContent: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  dynamicFieldItem: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  requiredText: {
    color: 'red',
    fontSize: 14,
  },
});

export default FarmerProductEdit;
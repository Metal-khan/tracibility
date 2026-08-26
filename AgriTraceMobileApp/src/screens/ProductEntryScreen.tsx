import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import AsyncStorage from '../services/secureStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';

// Define RootStackParamList for navigation type safety
type RootStackParamList = {
  Login: undefined;
  FarmerDashboard: undefined;
  ProductEntry: undefined;
  ProductQRCode: { productId: string };
};

type ProductEntryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductEntry'>;

const ProductEntryScreen: React.FC = () => {
  const navigation = useNavigation<ProductEntryScreenNavigationProp>();
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});

  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<{[key: string]: any}>({});

  // Section 1: Farmer / SME Information
  const [farmName, setFarmName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');

  // Section 2: Farm Location
  const [originLat, setOriginLat] = useState<string>('');
  const [originLon, setOriginLon] = useState<string>('');
  const [originAddress, setOriginAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState<boolean>(true);
  const [province, setProvince] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [landArea, setLandArea] = useState<string>('');
  const [landAreaUnit, setLandAreaUnit] = useState<string>('acres');

  // Section 3: Crop Details
  const [cropType, setCropType] = useState<string>('');
  const [variety, setVariety] = useState<string>('');
  const [farmingMethod, setFarmingMethod] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [sowingDate, setSowingDate] = useState<Date>(new Date());
  const [showSowingDatePicker, setShowSowingDatePicker] = useState<boolean>(false);
  const [harvestDate, setHarvestDate] = useState<Date>(new Date());
  const [showHarvestDatePicker, setShowHarvestDatePicker] = useState<boolean>(false);
  const [estimatedYield, setEstimatedYield] = useState<string>('');
  const [actualYield, setActualYield] = useState<string>('');
  const [qualityGrade, setQualityGrade] = useState<string>('');

  // Section 4: Environmental & Weather
  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [humidity, setHumidity] = useState<string>('');

  // Section 5: Post-Harvest Handling
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [showCollectionDatePicker, setShowCollectionDatePicker] = useState<boolean>(false);
  const [storageMethod, setStorageMethod] = useState<string>('');
  const [packagingType, setPackagingType] = useState<string>('');
  const [numPackages, setNumPackages] = useState<string>('');
  const [weightPerUnit, setWeightPerUnit] = useState<string>('');

  // Section 6 & 7: Media and Notes
  const [cropImages, setCropImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [farmImages, setFarmImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [documentUploads, setDocumentUploads] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [specialRemarks, setSpecialRemarks] = useState<string>('');


  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (mediaStatus !== 'granted') {
          Toast.show({ type: 'error', text1: 'Permission', text2: 'Camera roll access needed!', position: 'bottom' });
        }
      }

      getLiveLocation(); 
    })();
  }, []);

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

      if (Platform.OS === 'android') {
        setOriginAddress('Emulator Location (Address not available)');
      } else {
        try {
          let geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (geocode && geocode.length > 0 && geocode[0]) {
            const address = geocode[0];
            const parts = [address.name, address.street, address.city, address.country];
            const formattedAddress = parts.filter(part => part).join(', ');
            setOriginAddress(formattedAddress || 'Address not found for these coordinates.');
          } else {
            setOriginAddress('Address not found for these coordinates.');
          }
        } catch (geocodeError) {
          console.error("Error getting address:", geocodeError);
          setOriginAddress('Address could not be determined (Network Timeout).');
        }
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get current location automatically. Please check GPS settings.', position: 'bottom' });
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async (setImageState: React.Dispatch<React.SetStateAction<ImagePicker.ImagePickerAsset[]>>, fieldName: string) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) {
      // Re-encode every picked image to a real JPEG before storing it.
      // iOS hands back HEIC by default for camera-roll photos, and the
      // backend's `image` validation rule checks actual file bytes, not
      // just whatever MIME type we claim in the upload — a mislabeled
      // HEIC file gets rejected outright. This guarantees genuine JPEG
      // bytes regardless of the source format.
      const jpegAssets = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const context = ImageManipulator.manipulate(asset.uri);
            const rendered = await context.renderAsync();
            const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
            return { ...asset, uri: saved.uri, mimeType: 'image/jpeg', width: saved.width, height: saved.height };
          } catch (conversionError) {
            console.warn('Could not convert picked image to JPEG, uploading original:', conversionError);
            return asset;
          }
        })
      );
      setImageState(prevPhotos => [...prevPhotos, ...jpegAssets]);
      // Clear error for this field
      if (validationErrors[fieldName]) {
        setValidationErrors(prev => ({ ...prev, [fieldName]: false }));
      }
    }
  };

  const onChangeDate = (event: any, selectedDate: Date, setState: React.Dispatch<React.SetStateAction<Date>>, setShow: React.Dispatch<React.SetStateAction<boolean>>) => {
    const currentDate = selectedDate || new Date();
    setShow(Platform.OS === 'ios');
    setState(currentDate);
  };

  const handleSubmit = async () => {
    const errors: {[key: string]: boolean} = {};

    if (!contactNumber) errors['contactNumber'] = true;
    if (!province) errors['province'] = true;
    if (!district) errors['district'] = true;
    if (!landArea) errors['landArea'] = true;
    if (!cropType) errors['cropType'] = true;
    if (!variety) errors['variety'] = true;
    if (!farmingMethod) errors['farmingMethod'] = true;
    if (!season) errors['season'] = true;
    if (!harvestDate) errors['harvestDate'] = true;
    if (!estimatedYield) errors['estimatedYield'] = true;
    if (!qualityGrade) errors['qualityGrade'] = true;
    if (!collectionDate) errors['collectionDate'] = true;
    if (!storageMethod) errors['storageMethod'] = true;
    if (!packagingType) errors['packagingType'] = true;
    if (!numPackages) errors['numPackages'] = true;
    if (!weightPerUnit) errors['weightPerUnit'] = true;
    if (cropImages.length === 0) errors['cropImages'] = true;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Auto-scrolling to the first invalid field used ScrollView's legacy
      // getInnerViewNode() with ref.measureLayout(), which isn't reliable
      // under the New Architecture (newArchEnabled: true) — React Native
      // logs "ref.measureLayout must be called with a ref to a native
      // component" via console.error internally when it can't measure,
      // which isn't something a try/catch around the call can suppress
      // since it's not thrown. Dropped rather than patched: the toast below
      // already tells the user what's wrong.
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill all mandatory fields.', position: 'bottom' });
      return;
    }

    setSubmitLoading(true);

    const formData = new FormData();
    formData.append('farm_name', farmName);
    formData.append('contact_number', contactNumber);
    formData.append('origin_location_lat', originLat);
    formData.append('origin_location_lon', originLon);
    formData.append('origin_location_address', originAddress);
    formData.append('province', province);
    formData.append('district', district);
    formData.append('village', village);
    formData.append('land_area', landArea);
    formData.append('land_area_unit', landAreaUnit);
    formData.append('crop_type', cropType);
    formData.append('variety', variety);
    formData.append('farming_method', farmingMethod);
    formData.append('season', season);
    formData.append('sowing_date', sowingDate.toISOString().split('T')[0]);
    formData.append('harvest_date', harvestDate.toISOString().split('T')[0]);
    formData.append('estimated_yield', estimatedYield);
    formData.append('actual_yield', actualYield);
    formData.append('quality_grade', qualityGrade);
    formData.append('weather_condition', weatherCondition);
    formData.append('temperature', temperature);
    formData.append('humidity', humidity);
    formData.append('collection_date', collectionDate.toISOString().split('T')[0]);
    formData.append('storage_method', storageMethod);
    formData.append('packaging_type', packagingType);
    formData.append('num_packages', numPackages);
    formData.append('weight_per_unit', weightPerUnit);
    formData.append('total_weight', (parseFloat(numPackages) * parseFloat(weightPerUnit)).toString());
    formData.append('special_remarks', specialRemarks);

    const allImages = [...cropImages, ...farmImages, ...documentUploads];
    allImages.forEach((photo, index) => {
      // Use the MIME type Expo's picker reports instead of guessing from the
      // URI's file extension: on Android, picked assets often come back as
      // content:// URIs with no real extension (e.g. content://media/.../12345),
      // which silently produced an invalid type like "image/12345" and made
      // the backend reject every upload with "failed to upload."
      const mimeType = photo.mimeType || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      formData.append('photos[]', {
        uri: photo.uri, name: `photo_${index}.${extension}`, type: mimeType,
      } as any);
    });

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'User not authenticated.', position: 'bottom' });
        navigation.replace('Login');
        return;
      }

      const response = await api.post('/products', formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.message && response.data.product) {
        Toast.show({ type: 'success', text1: 'Success', text2: response.data.message, position: 'bottom' });
        if (response.data.product.id) {
          navigation.replace('ProductQRCode', { productId: response.data.product.id.toString() });
        } else {
          Toast.show({ type: 'warn', text1: 'QR Code Missing', text2: 'Product created, but ID not available.', position: 'bottom' });
          navigation.replace('FarmerDashboard');
        }
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Product created, but unexpected response.', position: 'bottom' });
        navigation.replace('FarmerDashboard');
      }
    } catch (error: any) {
      console.error('Product Entry Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('\n') : (error.response?.data?.message || 'Failed to add product.');
      Toast.show({ type: 'error', text1: 'Submission Failed', text2: errorMessage, position: 'bottom' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderImagePicker = (label: string, imageState: ImagePicker.ImagePickerAsset[], setImageState: React.Dispatch<React.SetStateAction<ImagePicker.ImagePickerAsset[]>>, fieldName: string) => (
    <View style={styles.imagePickerContainer} ref={(el) => { inputRefs.current[fieldName] = el; }}>
      <Text style={[styles.label, validationErrors[fieldName] && styles.errorText]}>{label}</Text>
      <Button title="Pick Images" onPress={() => pickImage(setImageState, fieldName)} />
      <View style={styles.imagePreviewContainer}>
        {imageState.map((photo, index) => (
          <Image key={index} source={{ uri: photo.uri }} style={styles.imagePreview} />
        ))}
      </View>
    </View>
  );

  const renderDatePicker = (label: string, date: Date, showPickerState: boolean, setShowPicker: React.Dispatch<React.SetStateAction<boolean>>, setDateState: React.Dispatch<React.SetStateAction<Date>>, fieldName: string) => (
    <View style={styles.dynamicFieldItem} ref={(el) => { inputRefs.current[fieldName] = el; }}>
      <Text style={[styles.label, validationErrors[fieldName] && styles.errorText]}>{label}</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.input, validationErrors[fieldName] && styles.errorBorder]}>
          <Text style={styles.datePickerText}>{date.toISOString().split('T')[0]}</Text>
      </TouchableOpacity>
      {showPickerState && (
          <DateTimePicker testID={`datePicker_${label}`} value={date} mode="date" display="default" onChange={(event, selectedDate) => onChangeDate(event, selectedDate, setDateState, setShowPicker)} />
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} ref={scrollRef}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Crop Data Entry</Text>
        </View>

        <Text style={styles.sectionTitle}>Section 1: Farmer / SME Information</Text>
        <TextInput ref={(el) => { inputRefs.current['farmName'] = el; }} style={[styles.input, validationErrors['farmName'] && styles.errorBorder]} placeholder="Farm Name" placeholderTextColor="#888" value={farmName} onChangeText={setFarmName} />
        <TextInput ref={(el) => { inputRefs.current['contactNumber'] = el; }} style={[styles.input, validationErrors['contactNumber'] && styles.errorBorder]} placeholder="Contact Number" placeholderTextColor="#888" value={contactNumber} onChangeText={setContactNumber} keyboardType="phone-pad" />

        <Text style={styles.sectionTitle}>Section 2: Farm Location</Text>
        {locationLoading ? (
            <ActivityIndicator size="small" color="#28a745" style={styles.locationLoadingIndicator} />
        ) : (
            <>
                <View style={styles.locationContainer}>
                    <TextInput ref={(el) => { inputRefs.current['originLat'] = el; }} style={[styles.halfInput, validationErrors['originLat'] && styles.errorBorder]} placeholder="Latitude" placeholderTextColor="#888" value={originLat} editable={false} />
                    <TextInput ref={(el) => { inputRefs.current['originLon'] = el; }} style={[styles.halfInput, validationErrors['originLon'] && styles.errorBorder]} placeholder="Longitude" placeholderTextColor="#888" value={originLon} editable={false} />
                </View>
                <TextInput ref={(el) => { inputRefs.current['originAddress'] = el; }} style={[styles.input, validationErrors['originAddress'] && styles.errorBorder]} placeholder="Address" placeholderTextColor="#888" value={originAddress} multiline numberOfLines={2} editable={false} />
                <Button title="Recapture Location" onPress={getLiveLocation} />
            </>
        )}
        <TextInput ref={(el) => { inputRefs.current['province'] = el; }} style={[styles.input, validationErrors['province'] && styles.errorBorder]} placeholder="Province / Region" placeholderTextColor="#888" value={province} onChangeText={setProvince} />
        <TextInput ref={(el) => { inputRefs.current['district'] = el; }} style={[styles.input, validationErrors['district'] && styles.errorBorder]} placeholder="District / City" placeholderTextColor="#888" value={district} onChangeText={setDistrict} />
        <TextInput ref={(el) => { inputRefs.current['village'] = el; }} style={[styles.input, validationErrors['village'] && styles.errorBorder]} placeholder="Village / Area" placeholderTextColor="#888" value={village} onChangeText={setVillage} />
        <View style={styles.locationContainer}>
            <TextInput ref={(el) => { inputRefs.current['landArea'] = el; }} style={[styles.halfInput, validationErrors['landArea'] && styles.errorBorder]} placeholder="Land Area" placeholderTextColor="#888" value={landArea} onChangeText={setLandArea} keyboardType="numeric" />
            <View style={styles.pickerContainerHalf}>
                <Picker selectedValue={landAreaUnit} style={styles.picker} onValueChange={setLandAreaUnit}>
                    <Picker.Item label="acres" value="acres" />
                    <Picker.Item label="hectares" value="hectares" />
                </Picker>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Section 3: Crop Details</Text>
        <TextInput ref={(el) => { inputRefs.current['cropType'] = el; }} style={[styles.input, validationErrors['cropType'] && styles.errorBorder]} placeholder="Crop Type" placeholderTextColor="#888" value={cropType} onChangeText={setCropType} />
        <TextInput ref={(el) => { inputRefs.current['variety'] = el; }} style={[styles.input, validationErrors['variety'] && styles.errorBorder]} placeholder="Variety (e.g., Basmati 385)" placeholderTextColor="#888" value={variety} onChangeText={setVariety} />
        <View ref={(el) => { inputRefs.current['farmingMethod'] = el; }} style={[styles.pickerContainer, validationErrors['farmingMethod'] && styles.errorBorder]}>
            <Picker selectedValue={farmingMethod} style={styles.picker} onValueChange={setFarmingMethod}>
                <Picker.Item label="Farming Method" value="" />
                <Picker.Item label="Organic" value="Organic" />
                <Picker.Item label="Conventional" value="Conventional" />
                <Picker.Item label="Integrated" value="Integrated" />
            </Picker>
        </View>
        <View ref={(el) => { inputRefs.current['season'] = el; }} style={[styles.pickerContainer, validationErrors['season'] && styles.errorBorder]}>
            <Picker selectedValue={season} style={styles.picker} onValueChange={setSeason}>
                <Picker.Item label="Season / Crop Cycle" value="" />
                <Picker.Item label="Kharif" value="Kharif" />
                <Picker.Item label="Rabi" value="Rabi" />
                <Picker.Item label="Zaid" value="Zaid" />
            </Picker>
        </View>
        {renderDatePicker("Sowing Date", sowingDate, showSowingDatePicker, setShowSowingDatePicker, setSowingDate, 'sowingDate')}
        {renderDatePicker("Harvest Date", harvestDate, showHarvestDatePicker, setShowHarvestDatePicker, setHarvestDate, 'harvestDate')}
        <TextInput ref={(el) => { inputRefs.current['estimatedYield'] = el; }} style={[styles.input, validationErrors['estimatedYield'] && styles.errorBorder]} placeholder="Estimated Yield (kg/tons)" placeholderTextColor="#888" value={estimatedYield} onChangeText={setEstimatedYield} keyboardType="numeric" />
        <TextInput ref={(el) => { inputRefs.current['actualYield'] = el; }} style={[styles.input, validationErrors['actualYield'] && styles.errorBorder]} placeholder="Actual Yield (kg/tons)" placeholderTextColor="#888" value={actualYield} onChangeText={setActualYield} keyboardType="numeric" />
        <View ref={(el) => { inputRefs.current['qualityGrade'] = el; }} style={[styles.pickerContainer, validationErrors['qualityGrade'] && styles.errorBorder]}>
            <Picker selectedValue={qualityGrade} style={styles.picker} onValueChange={setQualityGrade}>
                <Picker.Item label="Quality Grade" value="" />
                <Picker.Item label="A" value="A" />
                <Picker.Item label="B" value="B" />
                <Picker.Item label="C" value="C" />
            </Picker>
        </View>

        <Text style={styles.sectionTitle}>Section 4: Environmental & Weather</Text>
        <View ref={(el) => { inputRefs.current['weatherCondition'] = el; }} style={[styles.pickerContainer, validationErrors['weatherCondition'] && styles.errorBorder]}>
            <Picker selectedValue={weatherCondition} style={styles.picker} onValueChange={setWeatherCondition}>
                <Picker.Item label="Weather Condition" value="" />
                <Picker.Item label="Sunny" value="Sunny" />
                <Picker.Item label="Rainy" value="Rainy" />
                <Picker.Item label="Cloudy" value="Cloudy" />
            </Picker>
        </View>
        <View style={styles.locationContainer}>
            <TextInput ref={(el) => { inputRefs.current['temperature'] = el; }} style={[styles.halfInput, validationErrors['temperature'] && styles.errorBorder]} placeholder="Temperature (°C)" placeholderTextColor="#888" value={temperature} onChangeText={setTemperature} keyboardType="numeric" />
            <TextInput ref={(el) => { inputRefs.current['humidity'] = el; }} style={[styles.halfInput, validationErrors['humidity'] && styles.errorBorder]} placeholder="Humidity (%)" placeholderTextColor="#888" value={humidity} onChangeText={setHumidity} keyboardType="numeric" />
        </View>

        <Text style={styles.sectionTitle}>Section 5: Post-Harvest Handling</Text>
        {renderDatePicker("Collection Date", collectionDate, showCollectionDatePicker, setShowCollectionDatePicker, setCollectionDate, 'collectionDate')}
        <View ref={(el) => { inputRefs.current['storageMethod'] = el; }} style={[styles.pickerContainer, validationErrors['storageMethod'] && styles.errorBorder]}>
            <Picker selectedValue={storageMethod} style={styles.picker} onValueChange={setStorageMethod}>
                <Picker.Item label="Storage Method" value="" />
                <Picker.Item label="Cold Storage" value="Cold Storage" />
                <Picker.Item label="Open Storage" value="Open Storage" />
                <Picker.Item label="Controlled Atmosphere" value="Controlled Atmosphere" />
            </Picker>
        </View>
        <View ref={(el) => { inputRefs.current['packagingType'] = el; }} style={[styles.pickerContainer, validationErrors['packagingType'] && styles.errorBorder]}>
            <Picker selectedValue={packagingType} style={styles.picker} onValueChange={setPackagingType}>
                <Picker.Item label="Packaging Type" value="" />
                <Picker.Item label="Bag" value="Bag" />
                <Picker.Item label="Crate" value="Crate" />
                <Picker.Item label="Box" value="Box" />
                <Picker.Item label="Bulk" value="Bulk" />
            </Picker>
        </View>
        <View style={styles.locationContainer}>
            <TextInput ref={(el) => { inputRefs.current['numPackages'] = el; }} style={[styles.halfInput, validationErrors['numPackages'] && styles.errorBorder]} placeholder="No. of Packages" placeholderTextColor="#888" value={numPackages} onChangeText={setNumPackages} keyboardType="numeric" />
            <TextInput ref={(el) => { inputRefs.current['weightPerUnit'] = el; }} style={[styles.halfInput, validationErrors['weightPerUnit'] && styles.errorBorder]} placeholder="Weight per Unit (kg)" placeholderTextColor="#888" value={weightPerUnit} onChangeText={setWeightPerUnit} keyboardType="numeric" />
        </View>
        <Text style={styles.detailText}>Total Weight: {(!isNaN(parseFloat(numPackages)) && !isNaN(parseFloat(weightPerUnit))) ? (parseFloat(numPackages) * parseFloat(weightPerUnit)).toString() + ' kg' : 'Auto-calculated'}</Text>

        <Text style={styles.sectionTitle}>Section 6: Media Upload</Text>
        {renderImagePicker('Upload Crop Images (Min 1)', cropImages, setCropImages, 'cropImages')}
        <View style={styles.dynamicFieldItem} ref={(el) => { inputRefs.current['farmImages'] = el; }}>
          <Text style={[styles.label, validationErrors['farmImages'] && styles.errorText]}>Upload Farm Images (Optional)</Text>
          <Button title="Pick Images" onPress={() => pickImage(farmImages, setFarmImages, 'farmImages')} />
          <View style={styles.imagePreviewContainer}>
            {farmImages.map((photo, index) => (
              <Image key={index} source={{ uri: photo.uri }} style={styles.imagePreview} />
            ))}
          </View>
        </View>
        <View style={styles.dynamicFieldItem} ref={(el) => { inputRefs.current['documentUploads'] = el; }}>
          <Text style={[styles.label, validationErrors['documentUploads'] && styles.errorText]}>Upload Documents (Optional)</Text>
          <Button title="Pick Files" onPress={() => pickImage(documentUploads, setDocumentUploads, 'documentUploads')} />
          <View style={styles.imagePreviewContainer}>
            {documentUploads.map((photo, index) => (
              <Image key={index} source={{ uri: photo.uri }} style={styles.imagePreview} />
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Section 7: Additional Notes</Text>
        <TextInput ref={(el) => { inputRefs.current['specialRemarks'] = el; }} style={[styles.input, validationErrors['specialRemarks'] && styles.errorBorder]} placeholder="Special Remarks" placeholderTextColor="#888" value={specialRemarks} onChangeText={setSpecialRemarks} multiline numberOfLines={4} />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitLoading}>
          {submitLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Product</Text>
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
    color: '#28a745',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
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
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    minHeight: 50,
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
  pickerContainerHalf: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    // iOS renders this as its native wheel picker, which needs real vertical
    // room to display at all — at 50px (fine for Android's compact dropdown)
    // it rendered clipped/invisible on iOS.
    height: Platform.select({ ios: 180, default: 50 }),
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
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
  imagePickerContainer: {
    marginBottom: 15,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    justifyContent: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#28a745',
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
  detailText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  errorBorder: {
    borderColor: 'red',
  },
});

export default ProductEntryScreen;
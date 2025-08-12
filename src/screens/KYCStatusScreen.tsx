/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, { JSX, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../types/navigation'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageData, TabItem, Category } from '../types/data'
import ProfilePicture from '../components/ProfilePicture'
import DocumentCapture from '../components/DocumentCapture'
import { useGetCategories } from '../api/driverApi'
import { response } from '../storage/seed'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import Autocomplete from 'react-native-autocomplete-input'

type KYCStatusScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'KYCStatus'
>

interface Props {
  navigation: KYCStatusScreenNavigationProp
}

type TabIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

const personalInfoSchema = z.object({
  location: z.string().min(2, 'Location is required'),
  houseAddress: z.string().min(2, 'House address is required'),
  officeAddress: z.string().min(2, 'Office address is required'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      if (!date) return false
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        return age - 1 >= 18
      }
      return age >= 18
    }, 'You must be at least 18 years old'),
  gender: z.string().min(1, 'Gender is required'),
})

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

const driverLicenseSchema = z.object({
  licenseImage: z.string().min(1, "A valid driver's license image is required"),
})

type DriverLicenseFormData = z.infer<typeof driverLicenseSchema>
const KYCStatusScreen: React.FC<Props> = () => {
  const handleImageCaptured = (imageData: ImageData) => {
    console.log('Image URI:', imageData.uri)
    console.log('Dimensions:', imageData.width, imageData.height)
    console.log('Face bounds:', imageData.faceData)
    // Send to server...
  }

  const handleError = (error: Error) => {
    console.error('Camera error:', error.message)
  }
  const [activeTab, setActiveTab] = useState<TabIndex>(0)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const dataNeeded = response
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showGenderPicker, setShowGenderPicker] = useState(false)
  const [location, setLocation] = useState('')
  const [houseAddress, setHouseAddress] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')
  const [filteredLocations, setFilteredLocations] = useState<string[]>([])
  const [filteredHouseAddresses, setFilteredHouseAddresses] = useState<
    string[]
  >([])
  const [filteredOfficeAddresses, setFilteredOfficeAddresses] = useState<
    string[]
  >([])

  // Sample location data - you can replace this with your own data or API calls
  const sampleLocations = [
    'Downtown, City',
    'Westside, City',
    'Eastside, City',
    'Northside, City',
    'Southside, City',
    'Central, City',
    'Uptown, City',
    'Midtown, City',
    'Old Town, City',
    'Business District, City',
    'Residential Area, City',
    'Industrial Zone, City',
    'Shopping District, City',
    'University Area, City',
    'Airport District, City',
  ]

  // Sample address data - you can replace this with your own data or API calls
  const sampleAddresses = [
    '123 Main Street, Downtown, City',
    '456 Oak Avenue, Westside, City',
    '789 Pine Road, Eastside, City',
    '321 Elm Street, Northside, City',
    '654 Maple Drive, Southside, City',
    '987 Cedar Lane, Central, City',
    '147 Birch Boulevard, Uptown, City',
    '258 Willow Way, Downtown, City',
    '369 Spruce Street, Midtown, City',
    '741 Cherry Circle, Old Town, City',
  ]

  // Personal Info form
  const {
    control: personalControl,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors },
    setValue: setPersonalValue,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      location: '',
      houseAddress: '',
      officeAddress: '',
      dateOfBirth: '',
      gender: '',
    },
  })

  // Driver License form
  const {
    control: licenseControl,
    handleSubmit: handleLicenseSubmit,
    formState: { errors: licenseErrors },
  } = useForm<DriverLicenseFormData>({
    resolver: zodResolver(driverLicenseSchema),
    defaultValues: {
      licenseImage: '',
    },
  })

  // Categories from API
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetCategories()

  const categories: Category[] = categoriesResponse?.data ?? []
  const tabs: TabItem[] = [
    { id: 0, title: 'Personal Info' },
    { id: 1, title: 'Selfie' },
    { id: 2, title: 'Driver License' },
    { id: 3, title: 'Vehicle Info' },
    { id: 4, title: 'Insurance' },
    { id: 5, title: 'Inspection' },
    { id: 6, title: 'Availability' },
    { id: 7, title: 'Categories' },
  ]

  const daysOfWeek: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]
  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleDateChange = (date: Date) => {
    setShowDatePicker(false)
    setSelectedDate(date)
    // Update the form value using the proper method
    setPersonalValue('dateOfBirth', date.toISOString().split('T')[0])
  }

  const showDatePickerModal = () => {
    setShowDatePicker(true)
  }

  const hideDatePicker = () => {
    setShowDatePicker(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select date of birth'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const toggleGenderPicker = () => {
    setShowGenderPicker(!showGenderPicker)
  }

  const selectGender = (gender: string) => {
    setPersonalValue('gender', gender)
    setShowGenderPicker(false)
  }

  const handleLocationChange = (text: string) => {
    setLocation(text)
    setPersonalValue('location', text)

    if (text.length > 2) {
      const filtered = sampleLocations.filter((loc) =>
        loc.toLowerCase().includes(text.toLowerCase())
      )
      setFilteredLocations(filtered)
    } else {
      setFilteredLocations([])
    }
  }

  const handleHouseAddressChange = (text: string) => {
    setHouseAddress(text)
    setPersonalValue('houseAddress', text)

    if (text.length > 2) {
      const filtered = sampleAddresses.filter((address) =>
        address.toLowerCase().includes(text.toLowerCase())
      )
      setFilteredHouseAddresses(filtered)
    } else {
      setFilteredHouseAddresses([])
    }
  }

  const handleOfficeAddressChange = (text: string) => {
    setOfficeAddress(text)
    setPersonalValue('officeAddress', text)

    if (text.length > 2) {
      const filtered = sampleAddresses.filter((address) =>
        address.toLowerCase().includes(text.toLowerCase())
      )
      setFilteredOfficeAddresses(filtered)
    } else {
      setFilteredOfficeAddresses([])
    }
  }

  const selectLocation = (loc: string) => {
    setLocation(loc)
    setPersonalValue('location', loc)
    setFilteredLocations([])
  }

  const selectHouseAddress = (address: string) => {
    setHouseAddress(address)
    setPersonalValue('houseAddress', address)
    setFilteredHouseAddresses([])
  }

  const selectOfficeAddress = (address: string) => {
    setOfficeAddress(address)
    setPersonalValue('officeAddress', address)
    setFilteredOfficeAddresses([])
  }

  const renderPersonalInfo = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      {/* Location */}
      <Controller
        control={personalControl}
        name='location'
        render={({ field: { value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.addressInputContainer}>
              <Autocomplete
                data={filteredLocations}
                value={location}
                onChangeText={handleLocationChange}
                flatListProps={{
                  keyExtractor: (_, idx) => idx.toString(),
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      style={styles.autocompleteItem}
                      onPress={() => selectLocation(item)}
                    >
                      <Text style={styles.autocompleteItemText}>{item}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={styles.addressTextInput}
                placeholder='Select location'
                placeholderTextColor='#adb5bd'
                style={styles.autocompleteTextInput}
              />
            </View>
            {personalErrors.location && (
              <Text style={styles.errorText}>
                {personalErrors.location.message}
              </Text>
            )}
          </View>
        )}
      />
      {/* House Address */}
      <Controller
        control={personalControl}
        name='houseAddress'
        render={({ field: { value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>House Address</Text>
            <View style={styles.addressInputContainer}>
              <Autocomplete
                data={filteredHouseAddresses}
                value={houseAddress}
                onChangeText={handleHouseAddressChange}
                flatListProps={{
                  keyExtractor: (_, idx) => idx.toString(),
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      style={styles.autocompleteItem}
                      onPress={() => selectHouseAddress(item)}
                    >
                      <Text style={styles.autocompleteItemText}>{item}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={styles.addressTextInput}
                placeholder='Enter house address'
                placeholderTextColor='#adb5bd'
                style={styles.autocompleteTextInput}
              />
            </View>
            {personalErrors.houseAddress && (
              <Text style={styles.errorText}>
                {personalErrors.houseAddress.message}
              </Text>
            )}
          </View>
        )}
      />
      {/* Office Address */}
      <Controller
        control={personalControl}
        name='officeAddress'
        render={({ field: { value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Office Address</Text>
            <View style={styles.addressInputContainer}>
              <Autocomplete
                data={filteredOfficeAddresses}
                value={officeAddress}
                onChangeText={handleOfficeAddressChange}
                flatListProps={{
                  keyExtractor: (_, idx) => idx.toString(),
                  renderItem: ({ item }) => (
                    <TouchableOpacity
                      style={styles.autocompleteItem}
                      onPress={() => selectOfficeAddress(item)}
                    >
                      <Text style={styles.autocompleteItemText}>{item}</Text>
                    </TouchableOpacity>
                  ),
                }}
                inputContainerStyle={styles.addressTextInput}
                placeholder='Enter office address'
                placeholderTextColor='#adb5bd'
                style={styles.autocompleteTextInput}
              />
            </View>
            {personalErrors.officeAddress && (
              <Text style={styles.errorText}>
                {personalErrors.officeAddress.message}
              </Text>
            )}
          </View>
        )}
      />
      {/* Date of Birth */}
      <Controller
        control={personalControl}
        name='dateOfBirth'
        render={({ field: { value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.fieldInput}
              onPress={showDatePickerModal}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.placeholderText, value && { color: '#495057' }]}
              >
                {formatDate(value)}
              </Text>
            </TouchableOpacity>
            {personalErrors.dateOfBirth && (
              <Text style={styles.errorText}>
                {personalErrors.dateOfBirth.message}
              </Text>
            )}
            {showDatePicker && (
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode='date'
                onConfirm={handleDateChange}
                onCancel={hideDatePicker}
                maximumDate={
                  new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)
                } // 18 years ago
                minimumDate={
                  new Date(Date.now() - 100 * 365 * 24 * 60 * 60 * 1000)
                } // 100 years ago
              />
            )}
          </View>
        )}
      />
      {/* Gender */}
      <Controller
        control={personalControl}
        name='gender'
        render={({ field: { value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <TouchableOpacity
              style={styles.fieldInput}
              onPress={toggleGenderPicker}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.placeholderText, value && { color: '#495057' }]}
              >
                {value || 'Select gender'}
              </Text>
            </TouchableOpacity>
            {showGenderPicker && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => selectGender('Male')}
                >
                  <Text style={styles.dropdownOptionText}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => selectGender('Female')}
                >
                  <Text style={styles.dropdownOptionText}>Female</Text>
                </TouchableOpacity>
              </View>
            )}
            {personalErrors.gender && (
              <Text style={styles.errorText}>
                {personalErrors.gender.message}
              </Text>
            )}
          </View>
        )}
      />
      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={handlePersonalSubmit(() => setActiveTab(1))}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Selfie
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderSelfie = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Take a Selfie</Text>
      <ProfilePicture
        onImageCaptured={handleImageCaptured}
        onError={handleError}
      />
      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(2)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Driver&apos;s License
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderDriverLicense = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Driver&apos;s License</Text>
      <DocumentCapture
        documentType="license"
        onDocumentCaptured={(documentData) => {
          console.log('Driver License captured:', documentData)
          // Update form value
          setPersonalValue('licenseImage', documentData.uri)
          Alert.alert('Success', 'Driver\'s License captured successfully!')
        }}
        onError={(error) => {
          console.error('Driver License error:', error)
          Alert.alert('Error', error.message)
        }}
      />
      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(3)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Vehicle Info
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderCategories = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Categories</Text>
      {categoriesLoading && (
        <Text style={styles.placeholderText}>Loading categories...</Text>
      )}
      {categoriesError && (
        <Text style={styles.errorText}>Failed to load categories</Text>
      )}
      {categories && (
        <View style={styles.checkboxContainer}>
          {categories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id)
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.checkboxRow}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>{cat.name}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#28a745', marginTop: 24 },
        ]}
        onPress={() => {
          // Handle final submission
          Alert.alert('Success', 'KYC information submitted successfully!')
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Submit KYC Information
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderVehicleInfo = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Vehicle Information</Text>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Make</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>Vehicle make</Text>
          </View>
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Model</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>Vehicle model</Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Year</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>Year</Text>
          </View>
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>Vehicle color</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>License Plate</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Enter license plate number</Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>VIN</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>
            Vehicle Identification Number
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(4)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Insurance
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderInsurance = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Vehicle Insurance Policy</Text>
      <DocumentCapture
        documentType="insurance"
        onDocumentCaptured={(documentData) => {
          console.log('Insurance captured:', documentData)
          Alert.alert('Success', 'Insurance document captured successfully!')
        }}
        onError={(error) => {
          console.error('Insurance error:', error)
          Alert.alert('Error', error.message)
        }}
      />
      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(5)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Inspection
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderInspection = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>
        Vehicle Inspection Report / License
      </Text>
      <DocumentCapture
        documentType="inspection"
        onDocumentCaptured={(documentData) => {
          console.log('Inspection captured:', documentData)
          Alert.alert('Success', 'Inspection document captured successfully!')
        }}
        onError={(error) => {
          console.error('Inspection error:', error)
          Alert.alert('Error', error.message)
        }}
      />
      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(6)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Availability
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderAvailability = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Automobile Availability Options</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Available Days</Text>
        <View style={styles.checkboxContainer}>
          {daysOfWeek.map((day: string) => {
            const isSelected = selectedDays.includes(day)
            return (
              <TouchableOpacity
                key={day}
                style={styles.checkboxRow}
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                  ]}
                />
                <Text style={styles.checkboxLabel}>{day}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Start Time</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>HH:MM AM/PM</Text>
          </View>
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>End Time</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>HH:MM AM/PM</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Service Area</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Select service area</Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Special Notes</Text>
        <View style={[styles.fieldInput, styles.textArea]}>
          <Text style={styles.placeholderText}>
            Any special availability notes...
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.fieldInput,
          { backgroundColor: '#007AFF', marginTop: 24 },
        ]}
        onPress={() => setActiveTab(7)}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Categories
        </Text>
      </TouchableOpacity>
    </View>
  )
  const renderContent = (): JSX.Element => {
    switch (activeTab) {
      case 0:
        return renderPersonalInfo()
      case 1:
        return renderSelfie()
      case 2:
        return renderDriverLicense()
      case 3:
        return renderVehicleInfo()
      case 4:
        return renderInsurance()
      case 5:
        return renderInspection()
      case 6:
        return renderAvailability()
      case 7:
        return renderCategories()
      default:
        return renderPersonalInfo()
    }
  }

  const renderContentItem = ({ item }: { item: number }) => {
    return renderContent()
  }

  const handleTabPress = (tabId: number): void => {
    setActiveTab(tabId as TabIndex)
  }

  const contentData = [activeTab] // Single item array for FlatList

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#fff' />

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map((tab: TabItem) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => handleTabPress(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <FlatList
        data={contentData}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.toString()}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    maxHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
    minHeight: 40,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 24,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 50,
    maxHeight: 50,
    width: '100%',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    minHeight: 80,
    maxHeight: 80,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  placeholderText: {
    color: '#adb5bd',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  halfWidth: {
    width: '48%',
  },
  checkboxContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginTop: 8,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  dropdownDescription: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  addressInputContainer: {
    position: 'relative',
    width: '100%',
  },
  addressTextInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 50,
    maxHeight: 50,
    width: '100%',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  autocompleteListView: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  autocompleteRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  autocompleteDescription: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  autocompleteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  autocompleteItemText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  autocompleteTextInput: {
    fontSize: 16,
    color: '#495057',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
})

export default KYCStatusScreen

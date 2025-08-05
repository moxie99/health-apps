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
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../types/navigation'
import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImageData, SelfieData, TabItem } from '../types/data'
import ProfilePicture from '../components/ProfilePicture'
type KYCStatusScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'KYCStatus'
>

interface Props {
  navigation: KYCStatusScreenNavigationProp
}

type TabIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

const personalInfoSchema = z.object({
  location: z.string().min(2, 'Location is required'),
  houseAddress: z.string().min(2, 'House address is required'),
  officeAddress: z.string().min(2, 'Office address is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
})

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

const driverLicenseSchema = z.object({
  licenseImage: z.string().min(1, "A valid driver's license image is required"),
})

type DriverLicenseFormData = z.infer<typeof driverLicenseSchema>
const KYCStatusScreen: React.FC<Props> = ({ navigation }) => {
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

  // Personal Info form
  const {
    control: personalControl,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors },
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

  const tabs: TabItem[] = [
    { id: 0, title: 'Personal Info' },
    { id: 1, title: 'Selfie' },
    { id: 2, title: 'Driver License' },
    { id: 3, title: 'Vehicle Info' },
    { id: 4, title: 'Insurance' },
    { id: 5, title: 'Inspection' },
    { id: 6, title: 'Availability' },
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
            <View style={styles.fieldInput}>
              <Text
                style={styles.placeholderText}
                onPress={() => {}} // Placeholder for location picker
              >
                {value || 'Select location'}
              </Text>
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
            <View style={styles.fieldInput}>
              <Text
                style={styles.placeholderText}
                onPress={() => {}} // Placeholder for text input
              >
                {value || 'Enter house address'}
              </Text>
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
            <View style={styles.fieldInput}>
              <Text
                style={styles.placeholderText}
                onPress={() => {}} // Placeholder for text input
              >
                {value || 'Enter office address'}
              </Text>
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
            <View style={styles.fieldInput}>
              <Text
                style={styles.placeholderText}
                onPress={() => {}} // Placeholder for date picker
              >
                {value || 'Select date of birth'}
              </Text>
            </View>
            {personalErrors.dateOfBirth && (
              <Text style={styles.errorText}>
                {personalErrors.dateOfBirth.message}
              </Text>
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
            <View style={styles.fieldInput}>
              <Text
                style={styles.placeholderText}
                onPress={() => {}} // Placeholder for gender picker
              >
                {value || 'Select gender'}
              </Text>
            </View>
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
          Continue to Driver&apos;s License
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderSelfie = (): JSX.Element => (
    <ProfilePicture
      onImageCaptured={handleImageCaptured}
      onError={handleError}
    />
  )
  const renderDriverLicense = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Driver&apos;s License</Text>
      {/* License Upload */}
      <Controller
        control={licenseControl}
        name='licenseImage'
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Upload Driver&apos;s License</Text>
            <TouchableOpacity
              style={[
                styles.fieldInput,
                { alignItems: 'center', justifyContent: 'center' },
              ]}
              onPress={() => {
                // Placeholder for camera/ML logic for license
                // onChange('license-image-uri')
              }}
            >
              <Text style={styles.placeholderText}>
                {value
                  ? "Driver's License Uploaded"
                  : 'Take a photo of your license'}
              </Text>
            </TouchableOpacity>
            {licenseErrors.licenseImage && (
              <Text style={styles.errorText}>
                {licenseErrors.licenseImage.message}
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
        onPress={handleLicenseSubmit(() => setActiveTab(2))}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
          Continue to Vehicle Info
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
    </View>
  )
  const renderInsurance = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Vehicle Insurance Policy</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Insurance Company</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>
            Enter insurance company name
          </Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Policy Number</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Enter policy number</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Effective Date</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>MM/DD/YYYY</Text>
          </View>
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>MM/DD/YYYY</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Coverage Amount</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Enter coverage amount</Text>
        </View>
      </View>
    </View>
  )
  const renderInspection = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>
        Vehicle Inspection Report / License
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Inspection Certificate Number</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Enter certificate number</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Inspection Date</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>MM/DD/YYYY</Text>
          </View>
        </View>

        <View style={[styles.fieldContainer, styles.halfWidth]}>
          <Text style={styles.fieldLabel}>Expiry Date</Text>
          <View style={styles.fieldInput}>
            <Text style={styles.placeholderText}>MM/DD/YYYY</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Inspection Station</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>
            Enter inspection station name
          </Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.fieldInput}>
          <Text style={styles.placeholderText}>Pass/Fail</Text>
        </View>
      </View>
    </View>
  )
  const renderAvailability = (): JSX.Element => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Automobile Availability Options</Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Available Days</Text>
        <View style={styles.checkboxContainer}>
          {daysOfWeek.map((day: string) => (
            <TouchableOpacity key={day} style={styles.checkboxRow}>
              <View style={styles.checkbox} />
              <Text style={styles.checkboxLabel}>{day}</Text>
            </TouchableOpacity>
          ))}
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
      default:
        return renderPersonalInfo()
    }
  }

  const handleTabPress = (tabId: number): void => {
    setActiveTab(tabId as TabIndex)
  }
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
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
})

export default KYCStatusScreen

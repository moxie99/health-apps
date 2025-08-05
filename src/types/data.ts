import { Face } from '@react-native-ml-kit/face-detection'

/* eslint-disable @typescript-eslint/no-unused-vars */
export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicleType?: string
  licenseNumber?: string
  status: 'pending' | 'approved' | 'suspended'
  kycStatus: 'incomplete' | 'pending' | 'verified' | 'rejected'
}

export interface LoginResponse {
  token: string
  driver: Driver
}

export interface KycData {
  dateOfBirth: string
  residentialAddress: string
  nin: string
  vehicleType: string
  licenseNumber: string
  photoId: string
  selfie: string
  driverLicense: {
    number: string
    category: string
    issueDate: string
    expiryDate: string
  }
  vehicle: {
    registrationDocument: string
    make: string
    model: string
    year: number
    insuranceDocument: string
    inspectionCertificate: string
    licensePlate: string
  }
  banking: {
    accountNumber: string
    bankName: string
    sortCodeOrIBAN: string
    tin: string
    vatNumber?: string
  }
  kycStatus: 'incomplete' | 'pending' | 'verified' | 'rejected'
}

export interface ApiError {
  error: string
  errors?: string[]
  resendIn?: number
  needsConfirmation?: boolean
  email?: string
}

export interface TabItem {
  id: number
  title: string
}

export interface PersonalInfo {
  houseAddress: string
  officeAddress: string
  age: string
  gender: string
}

export interface DriverLicense {
  licenseNumber: string
  issueDate: string
  expiryDate: string
  licenseClass: string
}

interface VehicleInfo {
  make: string
  model: string
  year: string
  color: string
  licensePlate: string
  vin: string
}

export interface InsurancePolicy {
  insuranceCompany: string
  policyNumber: string
  effectiveDate: string
  expiryDate: string
  coverageAmount: string
}

export interface InspectionReport {
  certificateNumber: string
  inspectionDate: string
  expiryDate: string
  inspectionStation: string
  status: string
}

export interface AvailabilityOptions {
  availableDays: string[]
  startTime: string
  endTime: string
  serviceArea: string
  specialNotes: string
}

export interface OtpData {
  email: string
  otp: string
}

export interface PendingDriver {
  name: string
  email: string
  phone: string
  registrationStatus:
    | 'unconfirmed'
    | 'confirmed'
    | 'kyc_pending'
    | 'kyc_verified'
  createdAt: string
}

export interface ApiResponse<T = any> {
  statusCode: '00' | '01' | '02' | '03' | '04' | '05' | '06'
  data?: T
  message?: string
  error?: string
  errors?: string[]
  resendIn?: number
  email?: string
}

export interface SelfieData {
  imageUri: string
  livenessScore: number
  analysisDetails: any
  timestamp: number
  faceMetrics: any
}

export interface DocumentData {
  imageUri: string
  processedImageUri: string
  analysisResult: any
  timestamp: number
  documentMetrics: any
}

export interface ImageData {
  uri: string
  width: number
  height: number
  faceData: Face
}

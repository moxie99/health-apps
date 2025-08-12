import { useMutation, useQuery } from '@tanstack/react-query'
import Constants from 'expo-constants'
import {
  ApiResponse,
  Driver,
  KycData,
  LoginResponse,
  OtpData,
  ResetPasswordData,
  Category,
} from '../types/data'
import { statusCode } from '../utils/status'
import { tokenStorage } from '../storage/mmkv'
import { useAuthStore } from '../storage/authStore'

const API_BASE_URL = 'https://driver-service-ka7r.onrender.com/api/drivers' // TODO: move to env
// New root-level API base for non-driver endpoints like categories
const API_ROOT_URL = 'https://driver-service-ka7r.onrender.com/api' // TODO: move to env

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = tokenStorage.getToken()
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  const data = await response.json()
  console.log(
    `[fetchWithAuth] URL: ${url}, Status: ${response.status}, Data:`,
    data
  )

  if (!response.ok) {
    throw { ...data, httpStatus: response.status } as ApiResponse
  }

  return data as ApiResponse
}

// Root-level fetch helper for endpoints under /api (not /api/drivers)
const fetchFromApi = async (url: string, options: RequestInit = {}) => {
  const token = tokenStorage.getToken()
  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_ROOT_URL}${url}`, {
    ...options,
    headers,
  })
  console.log('___----___-___--___', response)
  const data = await response.json()
  console.log(
    `[fetchFromApi] URL: ${url}, Status: ${response.status}, Data:`,
    data
  )

  if (!response.ok) {
    throw { ...data, httpStatus: response.status } as ApiResponse
  }

  return data as ApiResponse
}

const useHasToken = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const token = useAuthStore((state) => state.token)
  return isAuthenticated && !!token
}
export const useRegisterDriver = () =>
  useMutation<
    ApiResponse,
    ApiResponse,
    { name: string; email: string; password: string; phone: string }
  >({
    mutationFn: (data) =>
      fetchWithAuth('/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })

export const useConfirmOtp = () =>
  useMutation<ApiResponse, ApiResponse, OtpData>({
    mutationFn: (data) => {
      console.log('=====>>>', JSON.stringify(data))
      return fetchWithAuth('/confirm-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  })

export const useResendOtp = () =>
  useMutation<ApiResponse, ApiResponse, { email: string }>({
    mutationFn: (data) =>
      fetchWithAuth('/resend-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })

export const useForgotPassword = () =>
  useMutation<ApiResponse, ApiResponse, { email: string }>({
    mutationFn: (data) =>
      fetchWithAuth('/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })

export const useResetPassword = () =>
  useMutation<ApiResponse, ApiResponse, ResetPasswordData>({
    mutationFn: (data) =>
      fetchWithAuth('/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })
export const useLoginDriver = () => {
  const login = useAuthStore((state) => state.login)

  return useMutation<
    ApiResponse<LoginResponse>,
    ApiResponse,
    { email: string; password: string }
  >({
    mutationFn: async (data) => {
      const response = (await fetchWithAuth('/login', {
        method: 'POST',
        body: JSON.stringify(data),
      })) as ApiResponse<LoginResponse>

      console.log('=========>>>>>>>', response, data)

      // Use Zustand login instead of AsyncStorage
      if (
        response.statusCode === statusCode.sucess &&
        response.data?.token &&
        response.data?.driver
      ) {
        await login(response.data.token, {
          id: response.data.driver.id,
          email: response.data.driver.email,
          name: response.data.driver.name,
          // Add any additional user fields you want to store
          phone: response.data.driver.phone,
          vehicleType: response.data.driver.vehicleType,
          licenseNumber: response.data.driver.licenseNumber,
          status: response.data.driver.status,
          kycStatus: response.data.driver.kycStatus,
        })
      }

      return response
    },
  })
}
export const useGetProfile = () => {
  const hasToken = useHasToken()
  return useQuery<ApiResponse<Driver>>({
    queryKey: ['profile'],
    queryFn: () => fetchWithAuth('/profile'),
    enabled: hasToken,
  })
}

export const useUpdateProfile = () => {
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation<
    ApiResponse,
    ApiResponse,
    {
      name?: string
      phone?: string
      vehicleType?: string
      licenseNumber?: string
    }
  >({
    mutationFn: (data) =>
      fetchWithAuth('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (response, variables) => {
      // Update user data in Zustand store after successful profile update
      const currentUser = useAuthStore.getState().user
      if (currentUser && response.statusCode === statusCode.sucess) {
        setUser({
          ...currentUser,
          ...variables, // Merge the updated fields
        })
      }
    },
  })
}

export const useSubmitKyc = () =>
  useMutation<ApiResponse, ApiResponse, KycData>({
    mutationFn: (data) =>
      fetchWithAuth('/kyc', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  })

export const useGetKyc = () => {
  const hasToken = useHasToken()

  return useQuery<ApiResponse<KycData>>({
    queryKey: ['kyc'],
    queryFn: () => fetchWithAuth('/kyc'),
    enabled: hasToken,
  })
}

export const useGetCategories = () => {
  const hasToken = useHasToken()
  return useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: () => fetchFromApi('/categories'),
    enabled: hasToken,
  })
}


import { zodResolver } from '@hookform/resolvers/zod'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { z } from 'zod'
import { statusCode } from '../utils/status'
import { useResetPassword } from '../api/driverApi'
import AnimatedScreen from '../components/AnimatedScreen'
import Input from '../components/Input'
import AnimatedButton from '../components/AnimatedButton'
import { ApiResponse } from '../types/data'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../types/navigation'
type ResetPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>

interface Props {
  navigation: ResetPasswordScreenNavigationProp
}
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const ResetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const { mutate: resetPassword } = useResetPassword()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = (data: ResetPasswordFormData) => {
    setIsLoading(true)
    resetPassword(
      { resetToken, newPassword: data.newPassword },
      {
        onSuccess: (res: ApiResponse) => {
          setIsLoading(false)
          if (res.statusCode === statusCode.sucess) {
            Alert.alert('Success', res.message || 'Password reset successfully')
            navigation.navigate('Login')
          }
        },
        onError: (err: ApiResponse) => {
          setIsLoading(false)
          Alert.alert(
            'Error',
            err.error || err.errors?.join(', ') || 'Failed to reset password'
          )
        },
      }
    )
  }

  return (
    <AnimatedScreen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Enter a new password (must include uppercase, lowercase, and
              number)
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name='newPassword'
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Input
                    placeholder='New Password'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isPassword
                    autoComplete='new-password'
                  />
                  {errors.newPassword && (
                    <Text style={styles.errorText}>
                      {errors.newPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name='confirmPassword'
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Input
                    placeholder='Confirm Password'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isPassword
                    autoComplete='new-password'
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <AnimatedButton
              title='Reset Password'
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedScreen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
  },
})

export default ResetPasswordScreen

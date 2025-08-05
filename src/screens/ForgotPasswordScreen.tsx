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
import { useForgotPassword } from '../api/driverApi'
import { zodResolver } from '@hookform/resolvers/zod'
import { statusCode } from '../utils/status'
import { ApiResponse } from '../types/data'
import AnimatedScreen from '../components/AnimatedScreen'
import AnimatedButton from '../components/AnimatedButton'
import Input from '../components/Input'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../types/navigation'
type ForgotPasswordScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPassword'
>

interface Props {
  navigation: ForgotPasswordScreenNavigationProp
}
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { mutate: forgotPassword } = useForgotPassword()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    forgotPassword(
      { email: data.email },
      {
        onSuccess: (res: ApiResponse) => {
          setIsLoading(false)
          if (res.statusCode === statusCode.sucess) {
            Alert.alert('Success', res.message || 'OTP sent to your email')
            navigation.navigate('ConfirmEmail', {
              email: data.email,
            })
          }
        },
        onError: (err: ApiResponse) => {
          setIsLoading(false)
          if (err.statusCode === statusCode.rateLimit) {
            Alert.alert(
              'Error',
              `Please wait ${err.resendIn} seconds before trying again`
            )
          } else {
            Alert.alert(
              'Error',
              err.error || err.errors?.join(', ') || 'Failed to send OTP'
            )
          }
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address to receive an OTP to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name='email'
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Input
                    placeholder='Email address'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoComplete='email'
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>
              )}
            />

            <AnimatedButton
              title='Send OTP'
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

export default ForgotPasswordScreen

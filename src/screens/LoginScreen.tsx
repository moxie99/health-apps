// screens/LoginScreen.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../types/navigation'
import { z } from 'zod'
import { useLoginDriver } from '../api/driverApi'
import { statusCode } from '../utils/status'
import { Controller, useForm } from 'react-hook-form'
import AnimatedButton from '../components/AnimatedButton'
import AnimatedScreen from '../components/AnimatedScreen'
import Input from '../components/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiResponse } from '../types/data'
type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>

interface Props {
  navigation: LoginScreenNavigationProp
}
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { mutate: login } = useLoginDriver()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data: LoginFormData) => {
    console.log(data)
    setIsLoading(true)
    login(data, {
      onSuccess: (response) => {
        console.log('---', response)
        setIsLoading(false)
        if (
          response.statusCode === statusCode.sucess &&
          response.data?.driver.status !== 'approved'
        ) {
          navigation.navigate('PendingApproval')
        } else {
          navigation.navigate('MainTabs')
        }
      },
      onError: (err: ApiResponse) => {
        console.log(err, '====')
        setIsLoading(false)
        if (err.statusCode === statusCode.pending) {
          Alert.alert(
            'Email Confirmation',
            Array.isArray(err.message) ? err.message.join(', ') : err.message,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate('ConfirmEmail', {
                    email: data.email,
                  })
                },
              },
            ]
          )
          return
        }
        Alert.alert(
          'Login Failed',
          (err as any).error ||
            (err as any).errors?.join(', ') ||
            'Please check your credentials and try again'
        )
      },
    })
  }
  const handleRegisterPress = () => {
    navigation.navigate('Register')
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
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your driver account</Text>
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

            <Controller
              control={control}
              name='password'
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Input
                    placeholder='Password'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    isPassword
                    autoComplete='password'
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <AnimatedButton
              title='Sign In'
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <AnimatedButton
              title='Create New Account'
              onPress={handleRegisterPress}
              variant='secondary'
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </Text>
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
    marginBottom: 48,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontSize: 14,
  },
  registerButton: {
    marginTop: 0,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#999999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logo: {
    height: 60,
    width: 60,
    resizeMode: 'cover',
    borderRadius: 30,
  },
})

export default LoginScreen

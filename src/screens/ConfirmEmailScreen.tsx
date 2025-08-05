/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useConfirmOtp, useResendOtp } from '../api/driverApi';
import { ApiResponse } from '../types/data';

type ConfirmEmailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ConfirmEmail'
>;
type ConfirmEmailScreenRouteProp = RouteProp<
  RootStackParamList,
  'ConfirmEmail'
>;

interface Props {
  navigation: ConfirmEmailScreenNavigationProp;
  route: ConfirmEmailScreenRouteProp;
}

const { width } = Dimensions.get('window');
const ConfirmEmailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputs = useRef<TextInput[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const {
    mutate: confirmOtp,
    isPending: isConfirmPending,
    error: confirmError,
    reset: resetConfirmError,
  } = useConfirmOtp();

  const {
    mutate: resendOtp,
    isPending: isResendPending,
    error: resendError,
    reset: resetResendError,
  } = useResendOtp();

  // Animation for error shake effect
  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Success animation
  const successAnimation = useRef(new Animated.Value(0)).current;
  const successScale = successAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  // Run success animation
  const startSuccessAnimation = () => {
    successAnimation.setValue(0);
    Animated.timing(successAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (confirmError || resendError) {
      startShake();
    }
  }, [confirmError, resendError]);

  // Add keyboard dismiss when tapping outside inputs
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setFocusedInput(null);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    // Clear any error messages when the user starts typing
    if (localError) setLocalError(null);
    if (confirmError) resetConfirmError();
    if (resendError) resetResendError();

    // Allow empty string (for deletion) or a single digit
    if (text === '' || /^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // If adding a digit and not the last field, move to next field
      if (text !== '' && index < 3) {
        inputs.current[index + 1].focus();
        setFocusedInput(index + 1);
      }
    }
  };

  // Handle clipboard paste functionality
  const handleClipboardPaste = async () => {
    try {
      // Clear any error messages when attempting to paste
      if (localError) setLocalError(null);
      if (confirmError) resetConfirmError();
      if (resendError) resetResendError();

      const text = await Clipboard.getStringAsync();
      if (text && /^\d{4}$/.test(text)) {
        const newOtp = text.split('');
        setOtp(newOtp);
        // Focus on last input after paste for better UX
        inputs.current[3].focus();
        setFocusedInput(3);
      }
    } catch (error) {
      console.log('Failed to read clipboard:', error);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace key press
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];

      // If current field is empty and not the first field, go to previous field
      if (!otp[index] && index > 0) {
        inputs.current[index - 1].focus();
        setFocusedInput(index - 1);
      }
      // If current field has content, clear it
      else if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      }
      // If it's the first field and it's empty, do nothing
    }
  };

  const handleFocus = (index: number) => {
    setFocusedInput(index);
    // Check if this is the first input and empty (likely a new focus)
    if (index === 0 && !otp.join('')) {
      // Check clipboard when first field is focused and no OTP entered yet
      handleClipboardPaste();
    }
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  // Handle tap on the OTP container - improves UX on iOS
  const handleContainerPress = (index: number) => {
    inputs.current[index].focus();
    setFocusedInput(index);
  };

  const handleSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      startShake();
      setLocalError('Please enter a 4-digit OTP');
      return;
    }

    // Clear any previous errors
    setLocalError(null);

    confirmOtp(
      { email, otp: otpCode },
      {
        onSuccess: async (response: ApiResponse) => {
          console.log('0000000', response);
          startSuccessAnimation();
          // Show success message after animation completes
          setTimeout(() => {
            Alert.alert('Success', 'Email confirmed successfully');
            navigation.navigate('Login');
          }, 800);
        },
        onError: (err: ApiResponse) => {
          console.log('===+++==', err);
          startShake();
          setLocalError(err.message || 'Failed to confirm OTP');
          if (err.error?.includes('expired')) {
            setOtp(['', '', '', '']);
          }
        },
      },
    );
  };

  const handleResend = () => {
    // Clear any previous errors before requesting new OTP
    setLocalError(null);
    resetConfirmError?.();
    resetResendError?.();

    resendOtp(
      { email },
      {
        onSuccess: () => {
          setResendCooldown(60);
          setOtp(['', '', '', '']);
          Alert.alert('Success', 'New OTP sent to your email');
        },
        onError: (err: any) => {
          startShake();
          if (err.resendIn) {
            setResendCooldown(err.resendIn);
            setLocalError(
              `Please wait ${err.resendIn} seconds before resending OTP`,
            );
          } else {
            setLocalError(err.error || 'Failed to resend OTP');
          }
        },
      },
    );
  };

  const renderProgressBar = () => {
    if (resendCooldown <= 0) return null;

    const progress = (resendCooldown / 60) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
    );
  };
  return (
    <LinearGradient colors={['#3b82f6', '#7caaf3ff']} style={styles.container}>
      <Animated.View
        style={[styles.card, { transform: [{ scale: successScale }] }]}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={24} color="#334155" />
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-open-outline" size={48} color="#3b82f6" />
          </View>
        </View>

        <Text style={styles.title}>Email Verification</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a 4-digit code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <TouchableOpacity
          style={styles.pasteButton}
          onPress={handleClipboardPaste}
        >
          <Ionicons name="clipboard-outline" size={16} color="#3b82f6" />
          <Text style={styles.pasteButtonText}>Paste from clipboard</Text>
        </TouchableOpacity>

        {/* Clear error on touch anywhere in the container */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (localError) setLocalError(null);
            if (confirmError) resetConfirmError();
            if (resendError) resetResendError();
          }}
          style={{ width: '100%' }}
        >
          <Animated.View
            style={[
              styles.otpContainer,
              { transform: [{ translateX: shakeAnimation }] },
            ]}
          >
            {otp.map((digit, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => handleContainerPress(index)}
                style={styles.inputWrapper}
              >
                <View
                  style={[
                    styles.otpInputContainer,
                    focusedInput === index && styles.focusedInputContainer,
                    digit && styles.filledInputContainer,
                  ]}
                >
                  <TextInput
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={text => handleOtpChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType={
                      Platform.OS === 'ios' ? 'number-pad' : 'numeric'
                    }
                    maxLength={1}
                    ref={ref => {
                      if (ref) inputs.current[index] = ref;
                    }}
                    autoFocus={index === 0}
                    onFocus={() => handleFocus(index)}
                    onBlur={handleBlur}
                    selectTextOnFocus={true}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>

        {localError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.error}>{localError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isConfirmPending && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isConfirmPending}
          activeOpacity={0.8}
        >
          {isConfirmPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || isResendPending}
          >
            <Text
              style={[
                styles.resendLink,
                (resendCooldown > 0 || isResendPending) && styles.disabledLink,
              ]}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : isResendPending
                ? 'Sending...'
                : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        {renderProgressBar()}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 25,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  pasteButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputWrapper: {
    width: 60,
    height: 60,
  },
  otpInputContainer: {
    width: 60,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  focusedInputContainer: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  filledInputContainer: {
    borderColor: '#64748b',
    backgroundColor: '#f1f5f9',
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    padding: 0,
    // On Android, adjust padding to center text better
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  error: {
    color: '#ef4444',
    marginLeft: 6,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#3b82f6',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: '#64748b',
    fontSize: 14,
  },
  resendLink: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledLink: {
    color: '#94a3b8',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
});

export default ConfirmEmailScreen;

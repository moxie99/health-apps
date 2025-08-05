import LottieView from 'lottie-react-native'
import React, { useEffect } from 'react'
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const { width } = Dimensions.get('window')

type StatusType = 'success' | 'error' | 'info'

interface StatusModalProps {
  visible: boolean
  status: StatusType
  title: string
  subtitle: string
  buttonText: string
  onPrimaryPress: () => void
  onClose?: () => void
  secondaryBtnText?: string
  onSecondaryPress?: () => void
}

const STATUS_COLORS: Record<StatusType, string> = {
  success: '#4CAF50',
  error: '#F44336',
  info: '#FFC107',
}

const STATUS_LOTTIES: Record<StatusType, any> = {
  success: require('../../assets/json/success.json'),
  error: require('../../assets/json/error.json'),
  info: require('../../assets/json/information.json'),
}

const StatusModal: React.FC<StatusModalProps> = ({
  visible,
  status,
  title,
  subtitle,
  buttonText,
  onPrimaryPress,
  onClose,
  secondaryBtnText,
  onSecondaryPress,
}) => {
  const fade = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      fade.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      })
    } else {
      fade.value = withTiming(0, { duration: 300 })
    }
  }, [visible])

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      {
        translateY: fade.value === 0 ? 20 : withTiming(0),
      },
    ],
  }))

  const backgroundColor = STATUS_COLORS[status]

  return (
    <Modal
      animationType='fade'
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, fadeStyle]}>
          <View style={[styles.header, { backgroundColor }]}>
            <LottieView
              source={STATUS_LOTTIES[status]}
              autoPlay
              loop={false}
              style={{ width: 100, height: 100 }}
            />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <TouchableOpacity
              onPress={onPrimaryPress}
              style={[styles.button, { backgroundColor }]}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>

            {secondaryBtnText && onSecondaryPress && (
              <Pressable onPress={onSecondaryPress} style={styles.skip}>
                <Text style={styles.skipText}>{secondaryBtnText}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

export default StatusModal

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    width: width * 0.6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  skip: {
    marginTop: 12,
  },
  skipText: {
    color: '#888',
    fontSize: 14,
  },
})

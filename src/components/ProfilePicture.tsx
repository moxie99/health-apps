import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native'
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
  PhotoFile,
} from 'react-native-vision-camera'
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Type definitions
export interface ImageData {
  uri: string
  width: number
  height: number
  faceData: Face
}

export interface ProfilePictureProps {
  onImageCaptured: (imageData: ImageData) => void
  onError: (error: Error) => void
}

const ProfilePictureComponent: React.FC<ProfilePictureProps> = ({
  onImageCaptured,
  onError,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [faceDetected, setFaceDetected] = useState<boolean>(false)
  const [captureEnabled, setCaptureEnabled] = useState<boolean>(false)
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false)
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const camera = useRef<Camera>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const devices = useCameraDevices()
  const device = devices.find((d) => d.position === 'front')
  const { hasPermission, requestPermission } = useCameraPermission()

  // Start face detection interval
  const startFaceDetection = () => {
    // Disable automatic detection for now due to file access issues
    console.log('Face detection ready - use manual detection button')
  }

  // Stop face detection interval
  const stopFaceDetection = () => {
    if (detectionIntervalRef.current) {
      console.log('Stopping face detection...')
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  // Alternative: Manual face detection approach
  const detectFacesManually = async () => {
    if (!camera.current || isDetecting) return

    try {
      setIsDetecting(true)

      const photo = await camera.current.takePhoto({})

      // Try different URI formats for Android compatibility
      let photoUri = photo.path
      if (!photoUri.startsWith('file://')) {
        photoUri = `file://${photo.path}`
      }

      console.log('Trying to detect faces in:', photoUri)

      const faces: Face[] = await FaceDetection.detect(photoUri, {
        performanceMode: 'fast',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'none',
        minFaceSize: 0.1,
      })

      console.log(`Manual detection found ${faces.length} faces`)

      if (faces.length === 1) {
        setFaceDetected(true)
        setCaptureEnabled(true)
        setPreviewImage(photoUri) // Store the image for preview
        Alert.alert(
          'Face Detected!',
          'Perfect! You can now capture your photo.'
        )
      } else if (faces.length === 0) {
        setFaceDetected(false)
        setCaptureEnabled(false)
        setPreviewImage(null)
        Alert.alert(
          'No Face Detected',
          'Please position your face in the oval and try again.'
        )
      } else {
        setFaceDetected(false)
        setCaptureEnabled(false)
        setPreviewImage(null)
        Alert.alert(
          'Multiple Faces',
          'Please ensure only your face is visible and try again.'
        )
      }
    } catch (error) {
      console.error('Manual face detection error:', error)
      Alert.alert(
        'Detection Error',
        'Unable to detect faces. Please try again.'
      )
      setFaceDetected(false)
      setCaptureEnabled(false)
    } finally {
      setIsDetecting(false)
    }
  }

  useEffect(() => {
    if (hasPermission) {
      setIsCameraActive(true)
      setPermissionDenied(false)
    } else {
      handlePermissionRequest()
    }
  }, [hasPermission])

  // Start detection when camera becomes active
  useEffect(() => {
    if (isCameraActive) {
      startFaceDetection()
    } else {
      stopFaceDetection()
    }

    // Cleanup on unmount
    return () => {
      stopFaceDetection()
    }
  }, [isCameraActive])

  const handlePermissionRequest = async () => {
    try {
      const granted = await requestPermission()

      if (granted) {
        setIsCameraActive(true)
        setPermissionDenied(false)
      } else {
        setPermissionDenied(true)
        setIsCameraActive(false)
      }
    } catch (error) {
      console.error('Permission request error:', error)
      setPermissionDenied(true)
    }
  }

  const openAppSettings = () => {
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera permission in your device settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ]
    )
  }

  const takePicture = async (): Promise<void> => {
    if (!camera.current || !captureEnabled || isProcessing) return

    try {
      setIsProcessing(true)
      stopFaceDetection()

      const photo: PhotoFile = await camera.current.takePhoto({
        flash: 'off',
        enableAutoRedEyeReduction: true,
      })

      // Final face verification
      const faces: Face[] = await FaceDetection.detect(
        photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`,
        {
          performanceMode: 'accurate',
          landmarkMode: 'all',
          contourMode: 'all',
          classificationMode: 'all',
          minFaceSize: 0.15,
        }
      )

      if (faces.length === 0) {
        Alert.alert(
          'No Face Detected',
          'Please ensure your face is clearly visible in the oval frame.'
        )
        setIsProcessing(false)
        startFaceDetection()
        return
      }

      if (faces.length > 1) {
        Alert.alert(
          'Multiple Faces Detected',
          'Please ensure only your face is visible in the frame.'
        )
        setIsProcessing(false)
        startFaceDetection()
        return
      }

      const face: Face = faces[0]
      const faceBounds = face.frame
      const faceWidth = faceBounds.width
      const faceHeight = faceBounds.height
      const aspectRatio = faceWidth / faceHeight

      if (aspectRatio < 0.5 || aspectRatio > 2.0) {
        Alert.alert(
          'Face Position',
          'Please position your face properly within the oval frame.'
        )
        setIsProcessing(false)
        startFaceDetection()
        return
      }

      const imageData: ImageData = {
        uri: photo.path,
        width: photo.width,
        height: photo.height,
        faceData: face,
      }

      onImageCaptured && onImageCaptured(imageData)
      setIsCameraActive(false)
      setIsProcessing(false)
    } catch (error) {
      console.error('Error taking picture:', error)
      const err =
        error instanceof Error ? error : new Error('Failed to capture image')
      onError && onError(err)
      setIsProcessing(false)
      startFaceDetection()
      Alert.alert('Error', 'Failed to capture image. Please try again.')
    }
  }

  const retryCapture = () => {
    setIsCameraActive(true)
    setFaceDetected(false)
    setCaptureEnabled(false)
    setIsProcessing(false)
    setPreviewImage(null) // Clear preview image
  }

  // Permission denied state
  if (permissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionDeniedContainer}>
          <Text style={styles.permissionDeniedTitle}>
            Camera Permission Required
          </Text>
          <Text style={styles.permissionDeniedText}>
            To take your profile picture, please enable camera permission in
            your device settings.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openAppSettings}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handlePermissionRequest}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Loading state
  if (!hasPermission && !permissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#2196F3' />
          <Text style={styles.loadingText}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    )
  }

  // No front camera
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Front camera not available</Text>
      </View>
    )
  }

  // Success state
  if (!isCameraActive) {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>
          Profile picture captured successfully!
        </Text>
        <TouchableOpacity style={styles.button} onPress={retryCapture}>
          <Text style={styles.buttonText}>Take Another Picture</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Camera view
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isCameraActive}
        photo={true}
        enableZoomGesture={false}
      />

      {/* Oval Overlay with Image Preview */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View
            style={[styles.ovalFrame, faceDetected && styles.ovalFrameActive]}
          >
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                resizeMode='cover'
              />
            )}
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            faceDetected ? styles.statusActive : styles.statusInactive,
          ]}
        />
        <Text style={styles.statusText}>
          {faceDetected
            ? 'Face detected - Ready to capture'
            : 'Position your face in the oval'}
        </Text>
      </View>

      {/* Clear Preview Button */}
      {previewImage && (
        <View style={styles.clearContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setPreviewImage(null)
              setFaceDetected(false)
              setCaptureEnabled(false)
            }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Manual Detection Button */}
      <View style={styles.testContainer}>
        <TouchableOpacity
          style={[styles.testButton, isDetecting && styles.testButtonDisabled]}
          onPress={detectFacesManually}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.testButtonText}>Check Face</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Capture Button */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            captureEnabled && styles.captureButtonActive,
          ]}
          onPress={takePicture}
          disabled={!captureEnabled || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color='#fff' size='small' />
          ) : (
            <View
              style={[
                styles.captureButtonInner,
                captureEnabled && styles.captureButtonInnerActive,
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          • Look directly at the camera{'\n'}• Ensure good lighting{'\n'}• Keep
          your face within the oval
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: screenWidth * 0.8,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  ovalFrame: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: screenWidth * 0.4,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    overflow: 'hidden', // This ensures the image is clipped to the oval shape
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: screenWidth * 0.4,
  },
  ovalFrameActive: {
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 25,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  testContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
  },
  testButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testButtonDisabled: {
    backgroundColor: '#666',
  },
  clearContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderColor: '#4CAF50',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  captureButtonInnerActive: {
    backgroundColor: '#4CAF50',
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  permissionDeniedTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  permissionDeniedText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  settingsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2196F3',
    minWidth: 200,
  },
  retryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

export default ProfilePictureComponent

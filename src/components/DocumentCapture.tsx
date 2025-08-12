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
  Animated,
  Easing,
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
export interface DocumentData {
  uri: string
  width: number
  height: number
  documentType: 'license' | 'insurance' | 'inspection'
  analysis: {
    facesDetected: number
    documentDetected: boolean
    textDetected: boolean
    qualityScore: number
    authenticityScore: number
  }
}

export interface DocumentCaptureProps {
  documentType: 'license' | 'insurance' | 'inspection'
  onDocumentCaptured: (documentData: DocumentData) => void
  onError: (error: Error) => void
}

const DocumentCaptureComponent: React.FC<DocumentCaptureProps> = ({
  documentType,
  onDocumentCaptured,
  onError,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [documentDetected, setDocumentDetected] = useState<boolean>(false)
  const [captureEnabled, setCaptureEnabled] = useState<boolean>(false)
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const camera = useRef<Camera>(null)
  const devices = useCameraDevices()
  const device = devices.find((d) => d.position === 'back')
  const { hasPermission, requestPermission } = useCameraPermission()

  // Animations
  const documentPulse = useRef(new Animated.Value(0)).current
  const borderAnim = useRef(new Animated.Value(0)).current
  const captureScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Pulse animation when document not detected
    if (!documentDetected && isCameraActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(documentPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(documentPulse, {
            toValue: 0,
            duration: 1000,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
      loop.start()
      return () => loop.stop()
    }
  }, [documentDetected, isCameraActive, documentPulse])

  useEffect(() => {
    // Border color animation when detection state changes
    Animated.timing(borderAnim, {
      toValue: documentDetected ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [documentDetected, borderAnim])

  useEffect(() => {
    // Capture button subtle scale when enabled
    if (captureEnabled) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(captureScale, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(captureScale, {
            toValue: 1.0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      )
      loop.start()
      return () => loop.stop()
    } else {
      captureScale.setValue(1)
    }
  }, [captureEnabled, captureScale])

  useEffect(() => {
    if (hasPermission) {
      setIsCameraActive(true)
      setPermissionDenied(false)
    } else {
      handlePermissionRequest()
    }
  }, [hasPermission])

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

  // Document analysis function
  const analyzeDocument = async (photoUri: string): Promise<any> => {
    try {
      setIsAnalyzing(true)
      
      // Face detection to ensure document is authentic
      const faces: Face[] = await FaceDetection.detect(photoUri, {
        performanceMode: 'fast',
        landmarkMode: 'none',
        contourMode: 'none',
        classificationMode: 'none',
        minFaceSize: 0.05,
      })

      // Document analysis simulation (you can integrate with real OCR/document analysis APIs)
      const analysis = {
        facesDetected: faces.length,
        documentDetected: true, // Simulated - integrate with document detection API
        textDetected: true, // Simulated - integrate with OCR API
        qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100
        authenticityScore: Math.floor(Math.random() * 20) + 80, // 80-100
      }

      // Validation logic
      if (faces.length === 0) {
        throw new Error('No faces detected in document. Please ensure the document is clearly visible.')
      }

      if (faces.length > 2) {
        throw new Error('Too many faces detected. Please ensure only the document is visible.')
      }

      if (analysis.qualityScore < 75) {
        throw new Error('Document quality too low. Please ensure good lighting and clear image.')
      }

      if (analysis.authenticityScore < 85) {
        throw new Error('Document authenticity cannot be verified. Please try again.')
      }

      return analysis
    } catch (error) {
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }

  const takePicture = async (): Promise<void> => {
    if (!camera.current || !captureEnabled || isProcessing) return

    try {
      setIsProcessing(true)

      const photo: PhotoFile = await camera.current.takePhoto({
        flash: 'auto',
        enableAutoRedEyeReduction: false,
      })

      // Prepare photo URI
      const photoUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`

      // Analyze the document
      const analysis = await analyzeDocument(photoUri)

      // Create document data
      const documentData: DocumentData = {
        uri: photo.path,
        width: photo.width,
        height: photo.height,
        documentType,
        analysis,
      }

      // Store preview and results
      setPreviewImage(photoUri)
      setAnalysisResults(analysis)

      // Call success callback
      onDocumentCaptured(documentData)
      setIsCameraActive(false)
      setIsProcessing(false)

    } catch (error) {
      console.error('Error capturing document:', error)
      const err = error instanceof Error ? error : new Error('Failed to capture document')
      onError(err)
      setIsProcessing(false)
      Alert.alert('Error', err.message || 'Failed to capture document. Please try again.')
    }
  }

  const retryCapture = () => {
    setIsCameraActive(true)
    setDocumentDetected(false)
    setCaptureEnabled(false)
    setIsProcessing(false)
    setPreviewImage(null)
    setAnalysisResults(null)
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
            To capture your {documentType} document, please enable camera permission in
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

  // No back camera
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Back camera not available</Text>
      </View>
    )
  }

  // Success state (after capture)
  if (!isCameraActive) {
    return (
      <View style={styles.container}>
        {previewImage ? (
          <Image source={{ uri: previewImage }} style={styles.successPreview} />
        ) : null}
        <View style={styles.successOverlay}>
          <View style={styles.successBadge}>
            <Text style={styles.successBadgeText}>✓</Text>
          </View>
          <Text style={styles.successText}>
            {documentType.charAt(0).toUpperCase() + documentType.slice(1)} captured successfully!
          </Text>
          {analysisResults && (
            <View style={styles.analysisResults}>
              <Text style={styles.analysisText}>
                Quality Score: {analysisResults.qualityScore}%
              </Text>
              <Text style={styles.analysisText}>
                Authenticity: {analysisResults.authenticityScore}%
              </Text>
              <Text style={styles.analysisText}>
                Faces Detected: {analysisResults.facesDetected}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.button} onPress={retryCapture}>
            <Text style={styles.buttonText}>Capture Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Camera view
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#4CAF50'],
  })
  const pulseScale = documentPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  })
  const pulseOpacity = documentPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0],
  })

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'license':
        return 'Driver\'s License'
      case 'insurance':
        return 'Insurance Document'
      case 'inspection':
        return 'Inspection Document'
      default:
        return 'Document'
    }
  }

  const getDocumentInstructions = () => {
    switch (documentType) {
      case 'license':
        return '• Place driver\'s license in the frame\n• Ensure all text is clearly visible\n• Good lighting for best results'
      case 'insurance':
        return '• Place insurance document in the frame\n• Ensure policy details are visible\n• Avoid glare and shadows'
      case 'inspection':
        return '• Place inspection report in the frame\n• Ensure certificate details are clear\n• Good lighting for verification'
      default:
        return '• Place document in the frame\n• Ensure all text is clearly visible\n• Good lighting for best results'
    }
  }

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

      {/* Document Frame Overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <Animated.View
            style={[
              styles.documentFrame,
              { borderColor },
              documentDetected && styles.documentFrameActive,
            ]}
          >
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                resizeMode='cover'
              />
            )}
            {!documentDetected && (
              <Animated.View
                pointerEvents='none'
                style={[
                  styles.pulseRing,
                  { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
                ]}
              />
            )}
          </Animated.View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Status Indicator */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            documentDetected ? styles.statusActive : styles.statusInactive,
          ]}
        />
        <Text style={styles.statusText}>
          {documentDetected
            ? 'Document detected - Ready to capture'
            : `Position ${getDocumentTitle()} in the frame`}
        </Text>
      </View>

      {/* Manual Detection Button */}
      <View style={styles.testContainer}>
        <TouchableOpacity
          style={[styles.testButton, isAnalyzing && styles.testButtonDisabled]}
          onPress={() => {
            // Simulate document detection for testing
            setDocumentDetected(true)
            setCaptureEnabled(true)
          }}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={styles.testButtonText}>Detect Document</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Capture Button */}
      <View style={styles.controlsContainer}>
        <Animated.View style={{ transform: [{ scale: captureScale }] }}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              captureEnabled && styles.captureButtonActive,
            ]}
            onPress={takePicture}
            disabled={!captureEnabled || isProcessing}
            activeOpacity={0.8}
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
        </Animated.View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          {getDocumentInstructions()}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    minHeight: screenHeight,
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
    height: screenWidth * 0.7,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  documentFrame: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#fff',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  documentFrameActive: {
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
  successPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 24,
  },
  successBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successBadgeText: {
    color: '#fff',
    fontSize: 38,
    fontWeight: 'bold',
  },
  analysisResults: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  analysisText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
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
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
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

export default DocumentCaptureComponent 
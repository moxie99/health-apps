import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Svg, { Defs, Rect, Mask, Ellipse } from 'react-native-svg'

interface OvalMaskProps {
  width: number
  height: number
  isPositioned: boolean
  isFaceDetected: boolean
}

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

const OvalMask: React.FC<OvalMaskProps> = ({
  width,
  height,
  isPositioned,
  isFaceDetected,
}) => {
  // Determine the color of the oval based on face detection and positioning
  const getStrokeColor = () => {
    if (!isFaceDetected) return '#ff3b30' // Red - no face
    if (!isPositioned) return '#ffcc00' // Yellow - face detected but not positioned
    return '#34c759' // Green - face positioned correctly
  }

  const strokeColor = getStrokeColor()
  const strokeWidth = 5

  return (
    <View style={styles.overlay}>
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id='mask' x='0' y='0' height='100%' width='100%'>
            <Rect height='100%' width='100%' fill='#fff' />
            <Ellipse
              cx={SCREEN_WIDTH / 2}
              cy={SCREEN_HEIGHT * 0.4}
              rx={width / 2}
              ry={height / 2}
              fill='#000'
            />
          </Mask>
        </Defs>
        {/* Semi-transparent overlay with oval cut out */}
        <Rect
          height='100%'
          width='100%'
          fill='rgba(0, 0, 0, 0.7)'
          mask='url(#mask)'
        />
        {/* Oval border that changes color based on face detection status */}
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={SCREEN_HEIGHT * 0.4}
          rx={width / 2 - strokeWidth / 2}
          ry={height / 2 - strokeWidth / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill='none'
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default OvalMask

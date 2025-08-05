/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onAnimationComplete?: () => void;
}

const AnimatedScreen: React.FC<AnimatedScreenProps> = ({
  children,
  style,
  onAnimationComplete,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    translateY.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const handleAnimationComplete = () => {
    if (onAnimationComplete) {
      onAnimationComplete();
    }
  };

  return (
    <Animated.View
      style={[style, animatedStyle]}
      onLayout={() => {
        // Trigger animation completion callback
        setTimeout(() => {
          handleAnimationComplete();
        }, 400);
      }}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedScreen;

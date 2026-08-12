import React, {useEffect, useRef} from 'react';
import {
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fades content in while sliding it up from below.
 * Used for soft entrance motion on cards and sections.
 */
const FadeInView = ({
  children,
  delay = 0,
  distance = 16,
  duration = 420,
  style,
}: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [delay, distance, duration, opacity, translateY]);

  return (
    <Animated.View
      style={[{opacity, transform: [{translateY}]}, style]}>
      {children}
    </Animated.View>
  );
};

export default FadeInView;

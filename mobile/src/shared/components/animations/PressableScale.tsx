import React, {useRef} from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the card scales down while pressed. */
  scaleTo?: number;
}

/**
 * Tappable card wrapper with a soft press-scale + dim animation.
 * Drop-in replacement for TouchableOpacity on card-like elements.
 */
const PressableScale = ({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animate = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressed ? scaleTo : 1,
        friction: 7,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: pressed ? 0.82 : 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    animate(true);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animate(false);
    onPressOut?.(event);
  };

  return (
    <Pressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}>
      <Animated.View style={{transform: [{scale}], opacity}}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default PressableScale;

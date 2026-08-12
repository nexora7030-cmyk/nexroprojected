import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import Theme from '../../../core/theme/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

const InfoCard = ({children, style, delay = 0}: Props) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.card,
        {opacity, transform: [{translateY}]},
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

export default InfoCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.glass,
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },
});

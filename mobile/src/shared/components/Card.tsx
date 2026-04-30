import React, { useRef } from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp, Pressable, Animated } from 'react-native';
import { useTheme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'surface' | 'glass' | 'outline' | 'flat';
  padding?: number;
  elevated?: boolean;
  onPress?: () => void;
}

export function Card({ children, style, variant = 'surface', padding, elevated = true, onPress }: CardProps) {
  const { colors, borderRadius, spacing, shadow } = useTheme();

  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.94, // tighter press = better feedback
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10, // THIS gives the jumpy bounce
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colors.glassBackground,
          borderColor: colors.glassBorder,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: colors.transparent,
          borderColor: colors.glassBorder,
          borderWidth: 1,
        };
      case 'flat':
        return {
          backgroundColor: colors.surfaceLight,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.glassBorder,
          borderWidth: 1,
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      hitSlop={8}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[
        styles.cardBase,
        {
          borderRadius: borderRadius.xl,
          padding: padding ?? spacing.md,
          transform: [{ scale: scale }],
          backfaceVisibility: 'hidden'
        },
        getVariantStyle(),
        style
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    overflow: 'visible',
  },
});

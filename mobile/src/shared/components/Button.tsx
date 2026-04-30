import React, { useCallback } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  loading?:    boolean;
  disabled?:   boolean;
  icon?:       React.ReactNode;
  iconRight?:  React.ReactNode;
  fullWidth?:  boolean;
  style?:      ViewStyle;
  labelStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  labelStyle,
}: ButtonProps) {
  const { colors, borderRadius, shadow } = useTheme();

  // ─── Apple-style scale-down on press ──────────────────────────────────
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const sizeStyles: Record<Size, { height: number; px: number; fontSize: number; radius: number }> = {
    sm: { height: 36, px: 14, fontSize: 13, radius: borderRadius.md },
    md: { height: 48, px: 20, fontSize: 15, radius: borderRadius.lg },
    lg: { height: 56, px: 28, fontSize: 17, radius: borderRadius.xl },
  };

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary:   { bg: colors.primary,  text: '#fff' },
    secondary: { bg: colors.primaryLight, text: colors.primary },
    outline:   { bg: 'transparent', text: colors.primary, border: colors.primary },
    ghost:     { bg: 'transparent', text: colors.text },
    danger:    { bg: colors.error, text: '#fff' },
  };

  const s = sizeStyles[size];
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.base,
        {
          height:            s.height,
          paddingHorizontal: s.px,
          borderRadius:      s.radius,
          backgroundColor:   v.bg,
          borderWidth:       v.border ? 1.5 : 0,
          borderColor:       v.border,
          opacity:           isDisabled ? 0.5 : 1,
          alignSelf:         fullWidth ? 'stretch' : 'flex-start',
          ...(variant === 'primary' ? shadow.md : {}),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }, labelStyle]}>
            {label}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconLeft:  { marginRight: 8 },
  iconRight: { marginLeft:  8 },
});

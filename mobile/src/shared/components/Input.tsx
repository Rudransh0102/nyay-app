import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface InputProps extends TextInputProps {
  label?:        string;
  error?:        string;
  hint?:         string;
  iconLeft?:     keyof typeof Ionicons.glyphMap;
  iconRight?:    keyof typeof Ionicons.glyphMap;
  onIconRightPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?:   boolean;
}

export function Input({
  label,
  error,
  hint,
  iconLeft,
  iconRight,
  onIconRightPress,
  containerStyle,
  isPassword,
  style,
  ...props
}: InputProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.glassBorder;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderRadius:    borderRadius.lg,
            borderWidth:     1.5,
            borderColor,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {iconLeft && (
          <Ionicons name={iconLeft} size={18} color={colors.textTertiary} style={styles.iconLeft} />
        )}
        <TextInput
          {...props}
          secureTextEntry={isPassword && !showPass}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            { color: colors.text, fontSize: typography.fontSize.md, flex: 1 },
            style,
          ]}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.iconRight}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
        {iconRight && !isPassword && (
          <TouchableOpacity onPress={onIconRightPress} style={styles.iconRight}>
            <Ionicons name={iconRight} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error, fontSize: typography.fontSize.xs }]}>{error}</Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { gap: 6 },
  label:    { fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 52 },
  input:    { paddingVertical: 0, fontWeight: '400' },
  iconLeft: { marginRight: 8 },
  iconRight:{ marginLeft:  8, padding: 2 },
  error:    { fontWeight: '500' },
  hint:     { fontWeight: '400' },
});

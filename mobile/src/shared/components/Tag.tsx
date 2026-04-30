import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface TagProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'error' | 'gray';
}

export function Tag({ label, variant = 'gray' }: TagProps) {
  const { colors, borderRadius, typography, mode } = useTheme();
  const isDark = mode === 'dark';

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return { bg: colors.primary + (isDark ? '20' : '15'), text: colors.primary };
      case 'accent': return { bg: colors.accent + (isDark ? '20' : '15'), text: colors.accent };
      case 'success': return { bg: colors.success + (isDark ? '20' : '15'), text: colors.success };
      case 'error': return { bg: colors.error + (isDark ? '20' : '15'), text: colors.error };
      default: return { bg: isDark ? colors.surfaceLight : '#E9ECEF', text: colors.textSecondary };
    }
  };

  const styles_v = getVariantStyle();

  return (
    <View style={[styles.container, { backgroundColor: styles_v.bg, borderRadius: borderRadius.sm }]}>
      <Text style={[styles.text, { color: styles_v.text, fontSize: typography.fontSize.xs - 2 }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

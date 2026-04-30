import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';

interface LoaderProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

export function Loader({ message, size = 'large', fullScreen = false }: LoaderProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.wrapper, fullScreen && styles.fullScreen, { backgroundColor: fullScreen ? colors.background : 'transparent' }]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.text, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { alignItems: 'center', justifyContent: 'center', padding: 24 },
  fullScreen: { flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 },
  text:       { marginTop: 12, fontWeight: '500' },
});

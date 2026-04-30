import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  onClear?: () => void;
  showClear?: boolean;
  searchIconName?: React.ComponentProps<typeof Ionicons>['name'];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined';
  autoCorrect?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onFilterPress,
  onClear,
  showClear = true,
  searchIconName = 'search-outline',
  size = 'md',
  variant = 'default',
  autoCorrect = false,
  autoCapitalize = 'none',
}: SearchBarProps) {
  const { colors, spacing, borderRadius, typography, shadow } = useTheme();

  const sizeConfig = {
    sm: { height: 40, iconSize: 16, paddingHorizontal: spacing.sm },
    md: { height: 50, iconSize: 20, paddingHorizontal: spacing.md },
    lg: { height: 60, iconSize: 24, paddingHorizontal: spacing.lg },
  };

  const config = sizeConfig[size];
  const bgColor = variant === 'outlined' ? colors.surface : colors.surfaceLight;
  const borderStyle = variant === 'outlined' 
    ? { borderWidth: 1, borderColor: colors.glassBorder, ...shadow.sm } 
    : {};

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: config.height,
          backgroundColor: bgColor,
          borderRadius: variant === 'outlined' ? borderRadius.xl : borderRadius.lg,
          paddingHorizontal: config.paddingHorizontal,
          ...borderStyle,
        },
      ]}
    >
      <Ionicons name={searchIconName} size={config.iconSize} color={colors.textSecondary} />

      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            fontSize: typography.fontSize.md,
            marginLeft: spacing.sm,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        selectionColor={colors.primary}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
      />

      {showClear && value.length > 0 && (
        <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear search" style={styles.clearButton}>
          <Ionicons name="close-circle" size={config.iconSize} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      {!showClear && onFilterPress && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton} accessibilityLabel="Filter results">
          <Ionicons name="options-outline" size={config.iconSize} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
  },
});

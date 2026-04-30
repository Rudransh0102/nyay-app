import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search acts, codes...' }: SearchBarProps) {
  const { colors, borderRadius, typography, shadow } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderColor: colors.glassBorder, ...shadow.sm }]}>
      <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, { color: colors.text, fontSize: typography.fontSize.md }]}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});

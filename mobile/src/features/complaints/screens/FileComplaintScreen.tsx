import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { Button, Input, Tag, Card } from '../../../shared/components';
import { complaintApi, type CreateComplaintPayload } from '../../../api/endpoints';
import { useComplaintStore } from '../../../store/useComplaintStore';

const CATEGORIES = ['Consumer Rights', 'Property Dispute', 'Labor Rights', 'RTI', 'Police Complaint', 'Cyber Crime', 'Other'];

interface Props { onSuccess: () => void }

export function FileComplaintScreen({ onSuccess }: Props) {
  const { colors, typography, spacing, borderRadius, shadow } = useTheme();
  const { addComplaint, isSubmitting, setSubmitting, setError } = useComplaintStore();

  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim())        e.title    = 'Title is required';
    if (!desc.trim())         e.desc     = 'Description is required';
    if (!category)            e.category = 'Please select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload: CreateComplaintPayload = { title, description: desc, category };
      const res = await complaintApi.create(payload);
      addComplaint(res.data.data);
      Alert.alert(
        '✅ Complaint Filed',
        `Your complaint has been submitted.\nTracking ID: ${res.data.data.tracking_id ?? res.data.data.id.slice(0, 8).toUpperCase()}`,
        [{ text: 'OK', onPress: onSuccess }],
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to file complaint');
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>
            File a Complaint
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
            Submit your grievance and track it in real-time.
          </Text>

          <View style={styles.form}>
            <Input
              label="Complaint Title"
              placeholder="e.g. Defective product not replaced"
              value={title}
              onChangeText={setTitle}
              iconLeft="document-text-outline"
              error={errors.title}
            />

            {/* Category */}
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: '500' }}>
                Category
              </Text>
              <View style={styles.categories}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: category === cat ? colors.primary : colors.surfaceLight,
                        borderRadius:    borderRadius.full,
                        borderWidth:     1,
                        borderColor:     category === cat ? colors.primary : colors.glassBorder,
                        ...(category === cat ? shadow.sm : {}),
                      },
                    ]}
                  >
                    <Text style={{ color: category === cat ? '#fff' : colors.textSecondary, fontSize: typography.fontSize.xs, fontWeight: '600' }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && (
                <Text style={{ color: colors.error, fontSize: typography.fontSize.xs, fontWeight: '500' }}>{errors.category}</Text>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSize.sm, fontWeight: '500' }}>
                Description
              </Text>
              <View
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderRadius:    borderRadius.lg,
                    borderColor:     errors.desc ? colors.error : colors.glassBorder,
                    borderWidth:     1.5,
                  },
                ]}
              >
                <Input
                  placeholder="Describe your complaint in detail…"
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                  numberOfLines={6}
                  style={{ height: 140, textAlignVertical: 'top', paddingTop: 12, color: colors.text }}
                  containerStyle={{ flex: 1, borderWidth: 0 }}
                />
              </View>
              {errors.desc && (
                <Text style={{ color: colors.error, fontSize: typography.fontSize.xs, fontWeight: '500' }}>{errors.desc}</Text>
              )}
            </View>

            <Button label="Submit Complaint" onPress={submit} loading={isSubmitting} fullWidth size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  heading:    { fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  sub:        { marginBottom: 24 },
  form:       { gap: 24 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:    { paddingHorizontal: 14, paddingVertical: 8 },
  textArea:   { overflow: 'hidden' },
});

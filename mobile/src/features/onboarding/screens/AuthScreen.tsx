import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOutUp, LinearTransition,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { Button, Input } from '../../../shared/components';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/useAuthStore';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { colors, typography, spacing, borderRadius, shadow } = useTheme();
  const { isLoading, setLoading } = useAuthStore();

  const [mode,     setMode]     = useState<Mode>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'citizen' | 'lawyer'>('citizen');
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register' && !name.trim())           e.name     = 'Full name is required';
    if (!email.trim() || !email.includes('@'))          e.email    = 'Valid email required';
    if (password.length < 8)                            e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), role } },
        });
        if (error) throw error;
        Alert.alert('Check your email', 'We sent a confirmation link. Verify it and then sign in.');
        setMode('login');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => { setMode(m); setErrors({}); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingHorizontal: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Animated.View entering={FadeIn.delay(100).duration(600)} style={styles.brand}>
            <View style={[styles.brandCircle, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder, borderWidth: 1 }]}>
              <Text style={styles.brandEmoji}>⚖️</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>
              NyayAPP
            </Text>
            <Text style={[styles.brandSub, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </Text>
          </Animated.View>

          {/* Tab switcher */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={[styles.tabs, { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.xl }]}
          >
            {(['login', 'register'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => switchMode(m)}
                style={[styles.tab, { borderRadius: borderRadius.lg }, mode === m && { backgroundColor: colors.surface, ...shadow.sm }]}
              >
                <Text style={[styles.tabText, { color: mode === m ? colors.primary : colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Fields */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} layout={LinearTransition.springify().damping(18)} style={styles.fields}>
            {mode === 'register' && (
              <Animated.View entering={FadeInUp.duration(350)} exiting={FadeOutUp.duration(250)}>
                <Input label="Full Name" placeholder="Rahul Sharma" value={name} onChangeText={setName} iconLeft="person-outline" error={errors.name} />
              </Animated.View>
            )}

            {mode === 'register' && (
              <Animated.View entering={FadeInUp.delay(80).duration(350)} exiting={FadeOutUp.duration(200)} style={styles.roleContainer}>
                <Text style={[styles.roleLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>I am a</Text>
                <View style={[styles.roleOptions, { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.lg }]}>
                  {(['citizen', 'lawyer'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[styles.roleOption, role === r && { backgroundColor: colors.surface, ...shadow.sm, borderRadius: borderRadius.md }]}
                    >
                      <Text style={{ color: role === r ? colors.primary : colors.textSecondary, fontSize: typography.fontSize.xs, fontWeight: role === r ? '700' : '500', letterSpacing: 0.5 }}>
                        {r.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} iconLeft="mail-outline" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <Input label="Password" placeholder="••••••••" value={password} onChangeText={setPassword} iconLeft="lock-closed-outline" isPassword error={errors.password} />
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Button label={mode === 'login' ? 'Sign In' : 'Create Account'} onPress={submit} loading={isLoading} fullWidth size="lg" />
          </Animated.View>

          {mode === 'login' && (
            <Animated.View entering={FadeInDown.delay(450).duration(400)}>
              <TouchableOpacity style={styles.forgot} onPress={async () => {
                if (!email.trim()) { Alert.alert('Enter your email first'); return; }
                await supabase.auth.resetPasswordForEmail(email.trim());
                Alert.alert('Check your email', 'A password reset link has been sent.');
              }}>
                <Text style={{ color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: '600', textAlign: 'center' }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {mode === 'register' && (
            <Animated.View entering={FadeInDown.delay(450).duration(400)}>
              <Text style={[styles.terms, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                By creating an account you agree to our{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Terms of Service</Text> and{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Privacy Policy</Text>.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  content:       { paddingTop: 48, paddingBottom: 60, gap: 24 },
  brand:         { alignItems: 'center', gap: 8, marginBottom: 8 },
  brandCircle:   { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandEmoji:    { fontSize: 40 },
  brandName:     { fontWeight: '800', letterSpacing: -1 },
  brandSub:      { fontWeight: '400' },
  tabs:          { flexDirection: 'row', padding: 4, gap: 4 },
  tab:           { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText:       { fontWeight: '600' },
  fields:        { gap: 20 },
  roleContainer: { gap: 8 },
  roleLabel:     { fontWeight: '500' },
  roleOptions:   { flexDirection: 'row', padding: 4, gap: 4 },
  roleOption:    { flex: 1, alignItems: 'center', paddingVertical: 10 },
  forgot:        { paddingTop: 4 },
  terms:         { textAlign: 'center', lineHeight: 18 },
});

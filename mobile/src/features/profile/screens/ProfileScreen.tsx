import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, Tag, Button, Loader } from '../../../shared/components';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLegalStore } from '../../../store/useLegalStore';
import { useThemeStore } from '../../../store/useThemeStore';
import apiClient, { isApiAbortError } from '../../../api/client';

interface Props {
  onEditProfile?:() => void;
}

const MENU_ITEMS = [
  { icon: 'bookmark-outline',     label: 'Saved Articles',    badge: null },
  { icon: 'notifications-outline', label: 'Notifications',    badge: '3' },
  { icon: 'language-outline',      label: 'Language',         badge: 'EN' },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Security', badge: null },
  { icon: 'help-circle-outline',   label: 'Help & Support',   badge: null },
];

export function ProfileScreen({ onEditProfile }: Props) {
  const { colors, typography, spacing, borderRadius, shadow, mode: currentMode } = useTheme();
  const { user, profile, roles, setProfile, logout } = useAuthStore();
  const { bookmarks } = useLegalStore();
  const { toggleTheme } = useThemeStore();
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get<any>('/profile');
        const payload = res.data.data ?? res.data;
        setProfile(payload.profile, Array.isArray(payload.roles) ? payload.roles : []);
      } catch (err) {
        if (isApiAbortError(err)) {
          console.warn('Profile request timed out. Check that the API is reachable from the Android device.', err);
        } else if ((err as any)?.response?.status === 404 && user) {
          setProfile({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            phone: null,
            avatar: null,
            created_at: user.created_at || new Date().toISOString(),
          }, ['citizen']);
        } else {
          console.error('Failed to fetch profile', err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const onLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          logout();
        },
      },
    ]);
  };

  const roleVariant: Record<string, 'primary' | 'success' | 'accent'> = {
    citizen: 'primary',
    lawyer:  'success',
    admin:   'accent',
  };

  if (loading) return <Loader fullScreen />;

  const safeRoles = Array.isArray(roles) ? roles : [];
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
  const displayProfile = profile || { 
    name: user?.user_metadata?.name || 'User',
    email: user?.email || '',
    avatar: null
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.full }]}>
            <Text style={[styles.avatarText, { color: colors.primary, fontSize: typography.fontSize.xl }]}>
              {displayProfile.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text, fontSize: typography.fontSize.lg }]}>
              {displayProfile.name}
            </Text>
            <Text style={[styles.email, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
              {displayProfile.email}
            </Text>
            <View style={styles.rolesRow}>
              {safeRoles.length > 0 ? safeRoles.map(r => (
                <Tag key={r} label={r.toUpperCase()} variant={roleVariant[r] || 'gray'} />
              )) : (
                <Tag label="CITIZEN" variant="primary" />
              )}
            </View>
          </View>
          {onEditProfile && (
            <TouchableOpacity onPress={onEditProfile} style={[styles.editBtn, { backgroundColor: colors.surfaceLight, borderRadius: borderRadius.full }]}>
              <Ionicons name="pencil-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, ...shadow.sm, borderWidth: 1, borderColor: colors.glassBorder }]}>
          {[
            { label: 'Bookmarks', value: safeBookmarks.length.toString(), icon: '🔖' },
            { label: 'Activity', value: '12', icon: '⚡' },
            { label: 'Joined', value: '2025', icon: '📅' },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.stat, i < 2 && { borderRightWidth: 1, borderRightColor: colors.glassBorder }]}>
              <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: colors.text, fontSize: typography.fontSize.lg }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Card style={styles.menuCard} variant="surface">
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={toggleTheme}>
            <View style={[styles.menuIcon, { backgroundColor: colors.glassBackground, borderRadius: borderRadius.md }]}>
              <Ionicons name={currentMode === 'dark' ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text, fontSize: typography.fontSize.md }]}>Appearance</Text>
            <View style={styles.menuRight}>
              <Tag label={currentMode.toUpperCase()} variant="gray" />
              <Ionicons name="repeat-outline" size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
          <View style={[styles.sep, { backgroundColor: colors.glassBorder }]} />

          {MENU_ITEMS.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: colors.glassBackground, borderRadius: borderRadius.md }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text, fontSize: typography.fontSize.md }]}>{item.label}</Text>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <Tag label={item.badge} variant="gray" />
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && <View style={[styles.sep, { backgroundColor: colors.glassBorder }]} />}
            </View>
          ))}
        </Card>

        <Button label="Sign Out" onPress={onLogout} variant="primary" size="md" fullWidth />

        <Text style={[styles.version, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
          NyayAPP v1.0.0 · Made in India 🇮🇳
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  profileHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  avatar:       { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontWeight: '800' },
  profileInfo:  { flex: 1 },
  name:         { fontWeight: '700', letterSpacing: -0.3 },
  email:        { fontWeight: '400', marginTop: 2 },
  rolesRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  editBtn:      { padding: 10 },
  statsRow:     { flexDirection: 'row', padding: 20, marginBottom: 20 },
  stat:         { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  statValue:    { fontWeight: '800', letterSpacing: -0.5 },
  statLabel:    { fontWeight: '500' },
  menuCard:     { marginBottom: 20, padding: 0, overflow: 'hidden' },
  menuItem:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuIcon:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuLabel:    { flex: 1, fontWeight: '500' },
  menuRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sep:          { height: 1, marginHorizontal: 16 },
  version:      { textAlign: 'center', marginTop: 12, fontWeight: '400' },
});

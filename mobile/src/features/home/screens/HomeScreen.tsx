import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { Card, SearchBar, Tag } from '../../../shared/components';
import { useAuthStore } from '../../../store/useAuthStore';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'explorer', title: 'Explore Laws', icon: 'compass-outline', color: '#4DA6FF' },
  { id: 'draft', title: 'Draft Doc', icon: 'create-outline', color: '#FF6B35' },
  { id: 'ask_ai', title: 'Ask AI', icon: 'sparkles-outline', color: '#8B5CF6' },
  { id: 'cases', title: 'Case Law', icon: 'briefcase-outline', color: '#FBBF24' },
];

const RECENT_ACTIVITY = [
  { id: '1', title: 'Property Dispute #4521', status: 'In Review', date: '2h ago', type: 'complaint' },
  { id: '2', title: 'Art. 21 - Right to Life', status: 'Bookmarked', date: '5h ago', type: 'bookmark' },
];

const TRENDING_TOPICS = [
  { id: '1', title: 'New Criminal Laws 2024', hits: '12k views', category: 'Legal Update' },
  { id: '2', title: 'Digital Privacy Rights', hits: '8k views', category: 'Civil' },
  { id: '3', title: 'Consumer Protection', hits: '5k views', category: 'Rights' },
];

export function HomeScreen({ onNavigate }: { onNavigate: (screen: any) => void }) {
  const { colors, spacing, borderRadius, typography, shadow, mode: currentMode } = useTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = currentMode === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={[styles.headerContainer, { backgroundColor: isDark ? colors.black : colors.surface, borderBottomLeftRadius: borderRadius['2xl'], borderBottomRightRadius: borderRadius['2xl'], overflow: 'hidden' }]}>
          <ImageBackground
            source={require('../../../../assets/home_header_background.png')}
            style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.xl }]}
            imageStyle={{ opacity: isDark ? 0.6 : 0.1 }}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                  Good Morning,
                </Text>
                <Text style={[styles.userName, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>
                  {user?.user_metadata?.name || 'Counsel'} 👋
                </Text>
              </View>
              <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.glassBackground, borderColor: colors.glassBorder }]}>
                <Ionicons name="notifications-outline" size={24} color={colors.text} />
                <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.background }]} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <SearchBar 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                placeholder="Search legal documents..."
              />
            </View>
          </ImageBackground>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.lg, paddingHorizontal: spacing.lg }]}>
            Quick Actions
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
          >
            {QUICK_ACTIONS.map((action, index) => (
              <Animated.View key={action.id} entering={FadeInRight.delay(index * 100)}>
                <TouchableOpacity 
                  onPress={() => onNavigate(action.id)}
                  style={[
                    styles.actionCard, 
                    { backgroundColor: colors.surface, borderRadius: borderRadius.xl, marginRight: spacing.md },
                    !isDark && shadow.sm
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: action.color + (isDark ? '20' : '10') }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={[styles.actionText, { color: colors.text, fontSize: typography.fontSize.xs }]}>
                    {action.title}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>

        {/* AI Banner */}
        <TouchableOpacity 
          onPress={() => onNavigate('ask_ai')}
          activeOpacity={0.9}
          style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}
        >
          <Card variant="surface" style={[styles.aiBanner, { backgroundColor: '#8B5CF6' }]}>
            <View style={styles.aiContent}>
              <View style={styles.aiIconLarge}>
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>Try Nyay AI Assistant</Text>
                <Text style={styles.aiSub}>Ask complex legal questions in plain language.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Trending Topics */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.lg }]}>
              Trending Legal Topics
            </Text>
          </View>
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            {TRENDING_TOPICS.map((topic, index) => (
              <Animated.View key={topic.id} entering={FadeInDown.delay(index * 100)}>
                <Card style={styles.topicCard} variant="outline">
                  <View style={styles.topicContent}>
                    <Tag label={topic.category} variant="primary" />
                    <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                    <View style={styles.topicFooter}>
                      <Ionicons name="trending-up" size={14} color={colors.success} />
                      <Text style={[styles.topicHits, { color: colors.textTertiary }]}>{topic.hits}</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.fontSize.lg }]}>
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            {RECENT_ACTIVITY.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)}>
                <Card style={styles.activityCard} variant={isDark ? 'glass' : 'surface'}>
                  <View style={[styles.activityIcon, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.background }]}>
                    <Ionicons 
                      name={item.type === 'complaint' ? 'chatbubble-outline' : 'bookmark-outline'} 
                      size={20} 
                      color={item.type === 'complaint' ? colors.primary : colors.accent} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.activitySub, { color: colors.textSecondary }]}>{item.status}</Text>
                  </View>
                  <Text style={[styles.activityDate, { color: colors.textTertiary, fontSize: 11 }]}>{item.date}</Text>
                </Card>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  headerContainer: { paddingBottom: 0 },
  header: { paddingBottom: 40, paddingTop: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontWeight: '500' },
  userName: { fontWeight: '700', marginTop: 4 },
  notificationBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontWeight: '700', letterSpacing: -0.3 },
  actionCard: { width: 105, height: 120, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontWeight: '700', textAlign: 'center', letterSpacing: -0.2 },
  aiBanner: { padding: 20, borderRadius: 24 },
  aiContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  aiIconLarge: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  aiSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, fontWeight: '500' },
  topicCard: { padding: 16, marginBottom: 12 },
  topicContent: { gap: 8 },
  topicTitle: { fontSize: 16, fontWeight: '700' },
  topicFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topicHits: { fontSize: 12, fontWeight: '600' },
  activityCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 16 },
  activityIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontWeight: '700', fontSize: 15 },
  activitySub: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  activityDate: { fontWeight: '500' },
});

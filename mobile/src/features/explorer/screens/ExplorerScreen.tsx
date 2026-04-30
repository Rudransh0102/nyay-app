import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../../theme';
import { Loader, SearchBar } from '../../../shared/components';
import apiClient, { isApiAbortError } from '../../../api/client';
import type { ApiPaginated } from '../../../api/endpoints';
import { CategoryChips } from '../components/CategoryChips';
import { LegalCard } from '../components/LegalCard';
import type { LegalAct } from '../types';

const CATEGORIES = [
  'All',
  'Constitutional',
  'Criminal',
  'Civil',
  'Evidence',
  'Family',
  'Transport',
  'Commercial',
];
const PAGE_SIZE = 20;

interface Props {
  onActPress: (act: LegalAct) => void;
}

export function ExplorerScreen({ onActPress }: Props) {
  const { colors, typography, spacing } = useTheme();
  const [acts, setActs] = useState<LegalAct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const fetchActs = useCallback(async (nextPage: number, replace: boolean) => {
    try {
      if (replace) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: nextPage,
        limit: PAGE_SIZE,
        q: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      };

      const res = await apiClient.get<ApiPaginated<LegalAct[]>>('/legal/acts', { params });
      const list = res.data.data ?? [];
      const meta = res.data.meta;

      setActs((prev) => (replace ? list : [...prev, ...list]));
      if (meta) {
        setHasMore(meta.page < meta.pages);
      } else {
        setHasMore(list.length >= PAGE_SIZE);
      }
    } catch (err) {
      if (isApiAbortError(err)) {
        console.warn('Legal acts request timed out. Check that the API is reachable from the Android device.', err);
      } else {
        console.error('Failed to load acts', err);
      }
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setPage(1);
    fetchActs(1, true);
  }, [fetchActs]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchActs(1, true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (loadingMore || isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchActs(nextPage, false);
  };

  const renderItem = ({ item, index }: { item: LegalAct; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(420).springify()}>
      <LegalCard act={item} onPress={onActPress} />
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.glowTop, { backgroundColor: colors.primaryLight }]} />
      <View style={[styles.glowBottom, { backgroundColor: colors.surfaceLight }]} />

      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.heading, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>Legal Explorer</Text>
        <Text style={[styles.subheading, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>Access Indian Acts & Constitutions</Text>
      </View>

      <View style={[styles.searchRow, { marginHorizontal: spacing.lg }]}>
        <SearchBar value={searchInput} onChangeText={setSearchInput} />
      </View>

      <CategoryChips
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={(cat) => setSelectedCategory(cat)}
      />

      {isLoading ? (
        <Loader message="Fetching legal database..." />
      ) : (
        <FlatList
          data={acts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 80 }}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={loadingMore ? <Loader message="Loading more acts..." /> : null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📖</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                No legal acts found matching your criteria
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 12 },
  heading: { fontWeight: '800', letterSpacing: -0.5 },
  subheading: { fontWeight: '400', marginTop: 2 },
  title:      { fontSize: 18, fontWeight: '700', color: '#0A0A0A' },
  subtitle:   { fontSize: 14, color: '#4B5563', marginTop: 4 },
  searchRow: { marginBottom: 8, marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.4,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.25,
  },
});

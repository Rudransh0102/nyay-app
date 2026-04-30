import React, { useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Card, Tag, Button, Loader } from '../../../shared/components';
import { complaintApi, type Complaint } from '../../../api/endpoints';
import { useComplaintStore } from '../../../store/useComplaintStore';

const statusVariant: Record<string, 'primary' | 'accent' | 'success' | 'error' | 'gray'> = {
  pending:   'accent',
  in_review: 'primary',
  resolved:  'success',
  rejected:  'error',
};

interface Props {
  onFileNew:   () => void;
  onViewDetail:(c: Complaint) => void;
}

export function ComplaintsListScreen({ onFileNew, onViewDetail }: Props) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { complaints, isLoading, setComplaints, setLoading } = useComplaintStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.getAll();
      setComplaints(res.data.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item, index }: { item: Complaint; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 60).duration(400).springify()}
      exiting={FadeOutDown.duration(300)}
      layout={LinearTransition.springify().damping(18).stiffness(200)}
    >
      <TouchableOpacity onPress={() => onViewDetail(item)} activeOpacity={0.75}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Tag
              label={item.status.replace('_', ' ').toUpperCase()}
              variant={statusVariant[item.status] ?? 'gray'}
            />
            <Text style={[styles.date, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
              {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.md }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.category, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
            {item.category}
          </Text>
          {item.tracking_id && (
            <View style={[styles.trackingBox, { backgroundColor: colors.primary + '15', borderRadius: borderRadius.sm }]}>
              <Ionicons name="barcode-outline" size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: typography.fontSize.xs, fontWeight: '600', marginLeft: 4 }}>
                {item.tracking_id}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <View>
          <Text style={[styles.heading, { color: colors.text, fontSize: typography.fontSize['2xl'] }]}>
            My Complaints
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Button label="+ File" onPress={onFileNew} size="sm" variant="primary" />
      </View>

      {isLoading ? (
        <Loader message="Loading complaints…" />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No complaints filed yet</Text>
              <Button label="File a Complaint" onPress={onFileNew} variant="primary" style={{ marginTop: 16 }} />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 12 },
  heading:     { fontWeight: '800', letterSpacing: -0.5 },
  sub:         { fontWeight: '400', marginTop: 2 },
  card:        { gap: 8 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date:        { fontWeight: '500' },
  title:       { fontWeight: '700', lineHeight: 24 },
  category:    { fontWeight: '400' },
  trackingBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4 },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyText:   { marginTop: 12, fontWeight: '500', fontSize: 16 },
});

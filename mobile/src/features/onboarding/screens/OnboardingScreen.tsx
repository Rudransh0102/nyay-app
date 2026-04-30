import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  Image,
  ImageSourcePropType,
  ViewToken,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedStyle,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { Button, Card, Tag } from '../../../shared/components';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Legal Drafting',
    description: 'Draft professional legal notices, agreements, and FIRs in minutes with AI assistance.',
    image: require('../../../../assets/onboarding/complaints.png'),
  },
  {
    id: '2',
    title: 'Landmark Cases',
    description: 'Research thousands of Supreme Court and High Court judgments with AI-powered summaries.',
    image: require('../../../../assets/onboarding/labor_laws.png'),
  },
  {
    id: '3',
    title: 'Ask Nyay AI',
    description: 'Get instant, plain-language explanations of complex legal sections and procedures.',
    image: require('../../../../assets/onboarding/crime.png'),
  },
];

const INTENTS = [
  { id: 'student', title: 'Law Student', icon: 'school-outline', desc: 'Case studies, research, and exams.' },
  { id: 'citizen', title: 'Citizen', icon: 'person-outline', desc: 'Daily rights, complaints, and legal aid.' },
  { id: 'business', title: 'Business', icon: 'business-outline', desc: 'Compliance, contracts, and regulations.' },
];

const INTERESTS = ['Criminal', 'Civil', 'Tax', 'Family', 'Corporate', 'Labor', 'Constitutional', 'Property', 'Cyber Law'];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { colors, typography, spacing, borderRadius, mode } = useTheme();
  const [step, setStep] = useState<'intro' | 'intent' | 'interests'>('intro');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollX.value = event.contentOffset.x; },
  });

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const renderIntro = () => (
    <View style={{ flex: 1 }}>
      <Animated.FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '10' }]}>
              <Image source={item.image} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Button label="GET STARTED" onPress={() => setStep('intent')} fullWidth size="lg" />
      </View>
    </View>
  );

  const renderIntent = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>What describes you best?</Text>
      <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Help us personalize your experience</Text>
      
      <View style={styles.grid}>
        {INTENTS.map((intent) => (
          <TouchableOpacity 
            key={intent.id}
            onPress={() => setSelectedIntent(intent.id)}
            activeOpacity={0.8}
          >
            <Card 
              variant="surface" 
              style={[
                styles.intentCard, 
                selectedIntent === intent.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
            >
              <View style={[styles.intentIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={intent.icon as any} size={28} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.intentTitle, { color: colors.text }]}>{intent.title}</Text>
                <Text style={[styles.intentDesc, { color: colors.textSecondary }]}>{intent.desc}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Button 
          label="CONTINUE" 
          onPress={() => setStep('interests')} 
          disabled={!selectedIntent} 
          fullWidth 
          size="lg" 
        />
      </View>
    </Animated.View>
  );

  const renderInterests = () => (
    <Animated.View entering={FadeIn} style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Choose your interests</Text>
      <Text style={[styles.stepSub, { color: colors.textSecondary }]}>Select categories you want to follow</Text>
      
      <ScrollView contentContainerStyle={styles.chipGrid} showsVerticalScrollIndicator={false}>
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <TouchableOpacity 
              key={interest} 
              onPress={() => toggleInterest(interest)}
              style={[
                styles.chip, 
                { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: colors.glassBorder }
              ]}
            >
              <Text style={[styles.chipText, { color: isSelected ? 'white' : colors.text }]}>{interest}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button label="FINISH" onPress={onComplete} fullWidth size="lg" />
        <TouchableOpacity onPress={onComplete} style={{ marginTop: 16, alignSelf: 'center' }}>
          <Text style={{ color: colors.textTertiary, fontWeight: '600' }}>SKIP FOR NOW</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      {step === 'intro' && renderIntro()}
      {step === 'intent' && renderIntent()}
      {step === 'interests' && renderInterests()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  illustrationCircle: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  image: { width: 180, height: 180 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  footer: { padding: 24, paddingBottom: 40 },
  stepContainer: { flex: 1, padding: 24 },
  stepTitle: { fontSize: 24, fontWeight: '800' },
  stepSub: { fontSize: 16, marginTop: 8, marginBottom: 32 },
  grid: { gap: 16 },
  intentCard: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  intentIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  intentTitle: { fontSize: 18, fontWeight: '700' },
  intentDesc: { fontSize: 14, marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1 },
  chipText: { fontWeight: '600', fontSize: 14 },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets, type StackNavigationProp, type StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { useTheme as useAppTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAVIGATION_CONFIG } from './navigationConfig';
import { Loader } from '../shared/components';
import { OnboardingScreen } from '../features/onboarding/screens/OnboardingScreen';
import { AuthScreen } from '../features/onboarding/screens/AuthScreen';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ExplorerScreen } from '../features/explorer/screens/ExplorerScreen';
import { ActDetailsScreen } from '../features/explorer/screens/ActDetailsScreen';
import { ArticleDetailScreen } from '../features/explorer/screens/ArticleDetailScreen';
import { DraftTypesScreen } from '../features/drafting/screens/DraftTypesScreen';
import { CasesListScreen } from '../features/cases/screens/CasesListScreen';
import { AskAIScreen } from '../features/ai/screens/AskAIScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import type { LegalAct } from '../features/explorer/types';
import type { LegalDocument } from '../api/endpoints';

type HomeQuickAction = 'explorer' | 'draft' | 'ask_ai' | 'cases' | 'profile';

interface ActSectionParam {
  id: string;
  section_number: string;
  title: string;
  content: string;
  chapter?: string;
  chapter_title?: string;
}

type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ActDetails: { act: LegalAct };
  ArticleDetail: { doc: ActSectionParam | (Partial<LegalDocument> & { id: string; title?: string; content?: string; plain_summary?: string }) };
  AskAI: undefined;
};

type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Draft: undefined;
  Cases: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const toImpactStyle = (type: 'light' | 'medium' | 'heavy') => {
  if (type === 'light') return Haptics.ImpactFeedbackStyle.Light;
  if (type === 'heavy') return Haptics.ImpactFeedbackStyle.Heavy;
  return Haptics.ImpactFeedbackStyle.Medium;
};

const triggerHaptic = async () => {
  await Haptics.impactAsync(toImpactStyle(NAVIGATION_CONFIG.hapticType));
};

type HomeTabProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
type ExploreTabProps = BottomTabScreenProps<MainTabParamList, 'Explore'>;
type ActDetailsRouteProps = StackScreenProps<RootStackParamList, 'ActDetails'>;
type ArticleDetailRouteProps = StackScreenProps<RootStackParamList, 'ArticleDetail'>;
type AskAIRouteProps = StackScreenProps<RootStackParamList, 'AskAI'>;

function HomeTabScreen({ navigation }: HomeTabProps) {
  return <HomeScreen onNavigate={(screen: HomeQuickAction) => {
    if (screen === 'explorer') {
      navigation.navigate('Explore');
      return;
    }
    if (screen === 'draft') {
      navigation.navigate('Draft');
      return;
    }
    if (screen === 'cases') {
      navigation.navigate('Cases');
      return;
    }
    if (screen === 'profile') {
      navigation.navigate('Profile');
      return;
    }
    if (screen === 'ask_ai') {
      const parent = navigation.getParent<StackNavigationProp<RootStackParamList>>();
      parent?.navigate('AskAI');
      return;
    }
  }} />;
}

function ExploreTabScreen({ navigation }: ExploreTabProps) {
  return <ExplorerScreen onActPress={(act) => {
    const parent = navigation.getParent<StackNavigationProp<RootStackParamList>>();
    parent?.navigate('ActDetails', { act });
  }} />;
}

function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
          if (route.name === 'Draft') iconName = focused ? 'create' : 'create-outline';
          if (route.name === 'Cases') iconName = focused ? 'briefcase' : 'briefcase-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, backgroundColor: colors.tabBar, borderTopColor: colors.tabBarBorder },
        animationEnabled: NAVIGATION_CONFIG.tabAnimationEnabled,
      })}
      screenListeners={{
        tabPress: () => {
          if (NAVIGATION_CONFIG.hapticOnTabPress) {
            void triggerHaptic();
          }
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeTabScreen} />
      <Tab.Screen name="Explore" component={ExploreTabScreen} />
      <Tab.Screen name="Draft" component={DraftTypesScreen} />
      <Tab.Screen name="Cases" component={CasesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ActDetailsScreenRoute({ navigation, route }: ActDetailsRouteProps) {
  return (
    <ActDetailsScreen
      act={route.params.act}
      onBack={() => navigation.goBack()}
      onSectionPress={(sec) => navigation.navigate('ArticleDetail', { doc: sec })}
    />
  );
}

function ArticleDetailScreenRoute({ navigation, route }: ArticleDetailRouteProps) {
  return <ArticleDetailScreen doc={route.params.doc} onBack={() => navigation.goBack()} />;
}

function AskAIScreenRoute({ navigation }: AskAIRouteProps) {
  return <AskAIScreen onBack={() => navigation.goBack()} />;
}

export function AppNavigator() {
  const scheme = useColorScheme();
  const { setSession, isAuthenticated, isLoading } = useAuthStore();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const prevRouteRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem('nyay_onboarded').then((val) => setOnboarded(val === 'true'));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('nyay_onboarded', 'true');
    setOnboarded(true);
  };

  const stackPreset = useMemo(() => {
    if (NAVIGATION_CONFIG.stackAnimation === 'fade') {
      return TransitionPresets.FadeFromBottomAndroid;
    }
    if (NAVIGATION_CONFIG.stackAnimation === 'slide_from_left') {
      return TransitionPresets.SlideFromRightIOS;
    }
    return TransitionPresets.SlideFromRightIOS;
  }, []);

  if (onboarded === null || isLoading) return <Loader fullScreen />;
  if (!onboarded) return <OnboardingScreen onComplete={completeOnboarding} />;
  if (!isAuthenticated) return <AuthScreen />;

  return (
    <NavigationContainer
      theme={scheme === 'dark' ? DarkTheme : DefaultTheme}
      onStateChange={(state) => {
        if (!NAVIGATION_CONFIG.hapticOnSwipe || !state) return;
        const currentRoute = state.routes[state.index]?.name;
        if (currentRoute && prevRouteRef.current && currentRoute !== prevRouteRef.current) {
          void triggerHaptic();
        }
        prevRouteRef.current = currentRoute;
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: NAVIGATION_CONFIG.swipeEnabled,
          gestureResponseDistance: NAVIGATION_CONFIG.swipeEdgeWidth,
          ...stackPreset,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: NAVIGATION_CONFIG.stackTransitionDurationMs,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: NAVIGATION_CONFIG.stackTransitionDurationMs,
              },
            },
          },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ActDetails" component={ActDetailsScreenRoute} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreenRoute} />
        <Stack.Screen name="AskAI" component={AskAIScreenRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

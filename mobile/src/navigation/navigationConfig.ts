export type SwipeHapticType = 'light' | 'medium' | 'heavy';
export type StackAnimationPreset = 'default' | 'slide_from_right' | 'slide_from_left' | 'fade';

// Central navigation config for gestures, animation, and haptics.
export const NAVIGATION_CONFIG = {
  swipeEnabled: true,
  swipeEdgeWidth: 48,
  fullScreenGestureEnabled: false,
  stackAnimation: 'slide_from_right' as StackAnimationPreset,
  stackTransitionDurationMs: 280,
  tabAnimationEnabled: true,
  hapticOnSwipe: true,
  hapticOnTabPress: true,
  hapticType: 'medium' as SwipeHapticType,
} as const;

# Navigation Migration Notes

- The app now uses `@react-navigation/native` with stack and bottom tab navigators.
- All gestures, animations, and haptic feedback are configurable in `navigationConfig.ts`.
- Haptic feedback is triggered on tab press and swipe (if enabled).
- To add new screens, register them in `AppNavigator.tsx`.
- Remove `RootNavigator.tsx` and `BottomTabBar.tsx` when migration is complete.

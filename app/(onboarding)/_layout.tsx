import { Stack } from 'expo-router';

import { defaultTheme } from '../../src/ui/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: defaultTheme.colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}

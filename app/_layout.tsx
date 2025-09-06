// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

// these paths match what I see in your tree
import { ModeProvider } from '../providers/ModeContext';
import { MealsProvider } from '../providers/MealsContext';

export default function RootLayout() {
  return (
    <ModeProvider>
      <MealsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </MealsProvider>
    </ModeProvider>
  );
}






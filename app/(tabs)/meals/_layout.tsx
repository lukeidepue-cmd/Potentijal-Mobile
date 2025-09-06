// app/(tabs)/meals/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function MealsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Search Foods' }} />
    </Stack>
  );
}


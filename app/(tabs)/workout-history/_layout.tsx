// app/(tabs)/workout-history/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function WorkoutHistoryStack() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

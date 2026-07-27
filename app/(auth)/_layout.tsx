/**
 * Auth flow stack — sign-in → Strava connect → activity sync.
 */
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ animation: "fade" }} />
      <Stack.Screen name="connect-strava" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="sync" options={{ animation: "fade" }} />
    </Stack>
  );
}

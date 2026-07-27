/**
 * Placeholder tab screen for the Create button.
 * The tab listener in _layout.tsx intercepts presses and pushes /capture.
 * This screen exists only to satisfy the <Tabs.Screen> requirement.
 */
import { Redirect } from "expo-router";

export default function CaptureTab() {
  return <Redirect href="/capture" />;
}

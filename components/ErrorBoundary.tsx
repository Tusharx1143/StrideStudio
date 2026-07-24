/**
 * ErrorBoundary — catches rendering errors and displays a fallback UI
 * instead of crashing the entire app (white screen).
 *
 * Wrap template renders and other isolation-worthy subtrees with this.
 */
import React, { Component, type ReactNode } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught (logging, analytics, etc.) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error.message, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
        backgroundColor: colors.background,
        borderRadius: 12,
        minHeight: 160,
      }}
    >
      <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
      <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
        Something went wrong
      </Text>
      <Text
        style={{ color: colors.muted, fontSize: 12, fontWeight: "500", textAlign: "center", marginBottom: 20 }}
        numberOfLines={3}
      >
        {error.message}
      </Text>
      <TouchableOpacity
        onPress={onReset}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: colors.primary,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

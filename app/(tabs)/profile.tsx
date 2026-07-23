import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";

interface ConnectedDevice {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

export default function ProfileScreen() {
  const colors = useColors();
  const { activities, savedPostsCount } = useApp();
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
  const [devices, setDevices] = useState<ConnectedDevice[]>([
    { id: "1", name: "Garmin", icon: "⌚", connected: true },
    { id: "2", name: "Strava", icon: "🏃", connected: true },
    { id: "3", name: "Apple Health", icon: "❤️", connected: false },
    { id: "4", name: "Fitbit", icon: "📱", connected: false },
  ]);
  const [notifications, setNotifications] = useState(true);

  const toggleDevice = (id: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, connected: !d.connected } : d)));
  };

  return (
    <ScreenContainer className="p-0">
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: 32,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 36 }}>🏃</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "bold" }}>Athlete</Text>
            <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>Training is an art</Text>
          </View>

          {/* Stats Summary */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>{activities.length}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Activities</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>
                {totalDistance.toFixed(0)} km
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Total Distance</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "bold" }}>{savedPostsCount}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Posts Created</Text>
            </View>
          </View>

          {/* Connected Devices */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Connected Devices
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {devices.map((device, index) => (
                <View
                  key={device.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 16,
                    borderBottomWidth: index < devices.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{device.icon}</Text>
                    <View>
                      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{device.name}</Text>
                      <Text style={{ color: device.connected ? colors.success : colors.muted, fontSize: 12, marginTop: 2 }}>
                        {device.connected ? "Connected" : "Not connected"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={device.connected}
                    onValueChange={() => toggleDevice(device.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
              Settings
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Notifications</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Privacy Policy</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>Support</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.error,
              }}
            >
              <Text style={{ color: colors.error, fontSize: 16, fontWeight: "600" }}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

/**
 * ActivityPickerModal — bottom-sheet modal for selecting an activity
 * to use as the data source for template rendering.
 */
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { typeEmoji } from "@/lib/templates/shared/helpers";
import type { Activity } from "@/lib/app-data";
import {
  EditorColors,
  EditorSemantic,
} from "@/constants/editor-theme";

interface ActivityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  activities: Activity[];
  selectedActivityId: string | null;
  onSelect: (id: string) => void;
}

export function ActivityPickerModal({
  visible,
  onClose,
  activities,
  selectedActivityId,
  onSelect,
}: ActivityPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.modalSheet}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Activity</Text>
          <ScrollView bounces={false}>
            {activities.map((a, i) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => onSelect(a.id)}
                style={[
                  styles.modalItem,
                  i < activities.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: EditorColors.border },
                ]}
              >
                <View style={[
                  styles.modalItemIcon,
                  a.id === selectedActivityId && {
                    backgroundColor: EditorColors.primary,
                  },
                ]}>
                  <Text style={{ fontSize: 16 }}>{typeEmoji(a.type)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemTitle}>
                    {a.distance.toFixed(1)} km · {a.type}
                  </Text>
                  <Text style={styles.modalItemSubtitle}>{a.date}</Text>
                </View>
                {a.id === selectedActivityId && (
                  <Text style={{ color: EditorColors.primary, fontSize: 16 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: EditorColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: "60%",
    borderWidth: 1,
    borderColor: EditorColors.border,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: EditorSemantic.panelHandle,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: EditorColors.foreground,
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EditorColors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemTitle: {
    color: EditorColors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  modalItemSubtitle: {
    color: EditorColors.mutedText,
    fontSize: 12,
    marginTop: 1,
  },
});

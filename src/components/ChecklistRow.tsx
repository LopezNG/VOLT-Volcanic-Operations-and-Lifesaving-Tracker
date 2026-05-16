import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Circle } from "lucide-react-native";

import { colors, font, radii } from "../constants/theme";
import { getUrgencyLabel } from "../rules/planRules";
import type { ChecklistItem } from "../types";

const urgencyColors = {
  critical: { bg: colors.criticalBg, fg: colors.critical },
  soon: { bg: colors.warningBg, fg: "#6F4A00" },
  ready: { bg: colors.successBg, fg: colors.success }
};

export function ChecklistRow({
  item,
  onToggle
}: {
  item: ChecklistItem;
  onToggle: () => void;
}) {
  const urgency = urgencyColors[item.checked ? "ready" : item.urgency];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.check, item.checked && styles.checked]}>
        {item.checked ? (
          <Check color={colors.surface} size={15} strokeWidth={3} />
        ) : (
          <Circle color={colors.primary} size={17} strokeWidth={2.4} />
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.topLine}>
          <Text style={styles.title}>{item.label}</Text>
          <View style={[styles.urgency, { backgroundColor: urgency.bg }]}>
            <Text style={[styles.urgencyText, { color: urgency.fg }]}>
              {item.checked ? "Packed" : getUrgencyLabel(item.urgency)}
            </Text>
          </View>
        </View>
        <Text style={styles.detail}>{item.detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingVertical: 8
  },
  check: {
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  checked: {
    backgroundColor: colors.primary
  },
  copy: {
    flex: 1,
    gap: 3
  },
  topLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  title: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17
  },
  detail: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 14
  },
  urgency: {
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  urgencyText: {
    fontFamily: font.medium,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});

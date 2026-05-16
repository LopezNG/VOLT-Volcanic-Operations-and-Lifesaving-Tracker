import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";

import { colors, font, radii } from "../constants/theme";

export function Field({
  label,
  value,
  onChangeText,
  placeholder
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 30
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepButton}
        >
          <Minus color={colors.primary} size={15} strokeWidth={2.6} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.stepButton}
        >
          <Plus color={colors.primary} size={15} strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  );
}

export function ToggleRow({
  label,
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No"
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segment}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(false)}
          style={[styles.segmentItem, !value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, !value && styles.segmentActiveText]}>{falseLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(true)}
          style={[styles.segmentItem, value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value && styles.segmentActiveText]}>{trueLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 5
  },
  label: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  input: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: 13,
    minHeight: 42,
    paddingHorizontal: 12
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 42
  },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    height: 40,
    overflow: "hidden"
  },
  stepButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 36
  },
  stepValue: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 14,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center"
  },
  segment: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    height: 38,
    overflow: "hidden",
    width: 118
  },
  segmentItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  segmentActiveText: {
    color: colors.surface
  }
});

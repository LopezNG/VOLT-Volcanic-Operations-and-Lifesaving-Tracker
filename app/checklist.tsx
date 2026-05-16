import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Plus, ShoppingBag } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { ChecklistRow } from "../src/components/ChecklistRow";
import { Badge, Card, PrimaryButton, ProgressBar, SectionHeading } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";
import type { ChecklistItem } from "../src/types";

const filters: { key: "all" | ChecklistItem["category"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "respiratory", label: "Masks" },
  { key: "medical", label: "Meds" },
  { key: "family", label: "Baby" },
  { key: "pet", label: "Pets" },
  { key: "power", label: "Power" }
];

export default function ChecklistScreen() {
  const checklist = useVoltStore((state) => state.checklist);
  const toggleChecklistItem = useVoltStore((state) => state.toggleChecklistItem);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const packed = checklist.filter((item) => item.checked).length;
  const progress = Math.round((packed / checklist.length) * 100);
  const criticalMissing = checklist.filter((item) => item.urgency === "critical" && !item.checked);
  const visible = useMemo(
    () => (filter === "all" ? checklist : checklist.filter((item) => item.category === filter)),
    [checklist, filter]
  );

  return (
    <AppShell>
      <ScreenHeader title="Go-Bag Checklist" subtitle="Track emergency supplies and missing items" rightIcon={Plus} />

      <Card tone="surface">
        <SectionHeading title="Readiness" action={<Badge label={`${progress}%`} tone={progress > 75 ? "success" : "warning"} />} />
        <ProgressBar value={progress} />
        <Text style={styles.progressText}>
          {packed} of {checklist.length} items packed. Critical items stay visible until confirmed.
        </Text>
      </Card>

      {criticalMissing.length > 0 ? (
        <Card tone="critical">
          <Text style={styles.alertTitle}>Missing critical items</Text>
          <Text style={styles.alertBody}>{criticalMissing.map((item) => item.label).join(", ")}</Text>
        </Card>
      ) : (
        <Card tone="success">
          <Text style={styles.alertTitle}>Critical items confirmed</Text>
          <Text style={styles.alertBody}>N95 masks, goggles, medicines, and IDs are marked ready.</Text>
        </Card>
      )}

      <View style={styles.filterWrap}>
        {filters.map((item) => {
          const active = filter === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={[styles.filter, active && styles.activeFilter]}
            >
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card tone="surface">
        {visible.map((item) => (
          <ChecklistRow key={item.id} item={item} onToggle={() => toggleChecklistItem(item.id)} />
        ))}
      </Card>

      <PrimaryButton label="Add Custom Item" icon={ShoppingBag} onPress={() => undefined} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  progressText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  alertTitle: {
    color: colors.critical,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "900"
  },
  alertBody: {
    color: colors.critical,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  filter: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterText: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  activeFilterText: {
    color: colors.surface
  }
});

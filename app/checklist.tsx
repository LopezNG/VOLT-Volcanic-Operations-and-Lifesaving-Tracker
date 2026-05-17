import { useMemo, useState, type ReactNode } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { ChecklistRow } from "../src/components/ChecklistRow";
import { Field } from "../src/components/forms";
import { Badge, Card, PrimaryButton, ProgressBar, SectionHeading } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";
import type { ChecklistItem, Urgency } from "../src/types";

const filters: { key: "all" | ChecklistItem["category"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "respiratory", label: "Masks" },
  { key: "medical", label: "Meds" },
  { key: "family", label: "Baby" },
  { key: "pet", label: "Pets" },
  { key: "power", label: "Power" }
];

const categoryOptions: { key: ChecklistItem["category"]; label: string }[] = [
  { key: "family", label: "Family" },
  { key: "medical", label: "Medical" },
  { key: "power", label: "Power" },
  { key: "water", label: "Water" },
  { key: "pet", label: "Pet" },
  { key: "cash", label: "Cash" }
];

const urgencyOptions: { key: Urgency; label: string }[] = [
  { key: "critical", label: "Critical" },
  { key: "soon", label: "Soon" },
  { key: "ready", label: "Ready" }
];

const emptyItemDraft = {
  label: "",
  detail: "",
  category: "family" as ChecklistItem["category"],
  urgency: "soon" as Urgency
};

export default function ChecklistScreen() {
  const checklist = useVoltStore((state) => state.checklist);
  const toggleChecklistItem = useVoltStore((state) => state.toggleChecklistItem);
  const addChecklistItem = useVoltStore((state) => state.addChecklistItem);
  const updateChecklistItem = useVoltStore((state) => state.updateChecklistItem);
  const deleteChecklistItem = useVoltStore((state) => state.deleteChecklistItem);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | undefined>();
  const [itemDraft, setItemDraft] = useState(emptyItemDraft);
  const packed = checklist.filter((item) => item.checked).length;
  const progress = checklist.length > 0 ? Math.round((packed / checklist.length) * 100) : 0;
  const criticalMissing = checklist.filter((item) => item.urgency === "critical" && !item.checked);
  const visible = useMemo(
    () => (filter === "all" ? checklist : checklist.filter((item) => item.category === filter)),
    [checklist, filter]
  );

  async function saveCustomItem() {
    const label = itemDraft.label.trim();

    if (!label) {
      Alert.alert("Add an item name", "Custom go-bag items need a short label.");
      return;
    }

    if (editingItemId) {
      const existing = checklist.find((item) => item.id === editingItemId);
      if (!existing) return;

      await updateChecklistItem({
        ...existing,
        label,
        detail: itemDraft.detail.trim() || "Custom household item.",
        category: itemDraft.category,
        urgency: itemDraft.urgency,
        isCustom: true
      });
    } else {
      await addChecklistItem({
        label,
        detail: itemDraft.detail.trim() || "Custom household item.",
        category: itemDraft.category,
        urgency: itemDraft.urgency
      });
    }

    clearCustomForm();
  }

  function beginEditItem(item: ChecklistItem) {
    setEditingItemId(item.id);
    setItemDraft({
      label: item.label,
      detail: item.detail,
      category: item.category,
      urgency: item.urgency
    });
    setShowCustomForm(true);
  }

  function confirmDeleteItem(item: ChecklistItem) {
    Alert.alert("Delete custom item?", `${item.label} will be removed from this checklist.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteChecklistItem(item.id)
      }
    ]);
  }

  function clearCustomForm() {
    setShowCustomForm(false);
    setEditingItemId(undefined);
    setItemDraft(emptyItemDraft);
  }

  return (
    <AppShell>
      <ScreenHeader
        title="Go-Bag Checklist"
        subtitle="Track emergency supplies and missing items"
        rightIcon={showCustomForm ? X : Plus}
        onRightPress={() => (showCustomForm ? clearCustomForm() : setShowCustomForm(true))}
      />

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
          <View key={item.id}>
            <ChecklistRow item={item} onToggle={() => toggleChecklistItem(item.id)} />
            {item.isCustom ? (
              <View style={styles.customActions}>
                <Pressable style={styles.customAction} onPress={() => beginEditItem(item)}>
                  <Pencil color={colors.primary} size={14} strokeWidth={2.4} />
                  <Text style={styles.customActionText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.customAction} onPress={() => confirmDeleteItem(item)}>
                  <Trash2 color={colors.critical} size={14} strokeWidth={2.4} />
                  <Text style={[styles.customActionText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
      </Card>

      {showCustomForm ? (
        <Card tone="chip">
          <SectionHeading title={editingItemId ? "Edit custom item" : "Add custom item"} />
          <Field
            label="Item"
            value={itemDraft.label}
            onChangeText={(value) => setItemDraft((current) => ({ ...current, label: value }))}
            placeholder="Carrier, spare inhaler, battery pack"
          />
          <Field
            label="Detail"
            value={itemDraft.detail}
            onChangeText={(value) => setItemDraft((current) => ({ ...current, detail: value }))}
            placeholder="Why this matters for your household"
          />
          <Text style={styles.optionLabel}>Category</Text>
          <OptionWrap>
            {categoryOptions.map((option) => (
              <OptionChip
                key={option.key}
                label={option.label}
                active={itemDraft.category === option.key}
                onPress={() => setItemDraft((current) => ({ ...current, category: option.key }))}
              />
            ))}
          </OptionWrap>
          <Text style={styles.optionLabel}>Urgency</Text>
          <OptionWrap>
            {urgencyOptions.map((option) => (
              <OptionChip
                key={option.key}
                label={option.label}
                active={itemDraft.urgency === option.key}
                onPress={() => setItemDraft((current) => ({ ...current, urgency: option.key }))}
              />
            ))}
          </OptionWrap>
          <PrimaryButton
            label={editingItemId ? "Save Custom Item" : "Add Custom Item"}
            icon={ShoppingBag}
            onPress={saveCustomItem}
          />
        </Card>
      ) : (
        <PrimaryButton label="Add Custom Item" icon={ShoppingBag} onPress={() => setShowCustomForm(true)} />
      )}
    </AppShell>
  );
}

function OptionWrap({ children }: { children: ReactNode }) {
  return <View style={styles.optionWrap}>{children}</View>;
}

function OptionChip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.optionChip, active && styles.optionChipActive]} onPress={onPress}>
      <Text style={[styles.optionChipText, active && styles.optionChipActiveText]}>{label}</Text>
    </Pressable>
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
  },
  customActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    paddingBottom: 8
  },
  customAction: {
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: 5,
    minHeight: 30,
    paddingHorizontal: 10
  },
  customActionText: {
    color: colors.primary,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  deleteText: {
    color: colors.critical
  },
  optionLabel: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800"
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionChipText: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  optionChipActiveText: {
    color: colors.surface
  }
});

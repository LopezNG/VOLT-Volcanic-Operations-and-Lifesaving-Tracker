import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { HelpCircle, Phone, Save, UserPlus } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Field, Stepper, ToggleRow } from "../src/components/forms";
import { Card, PrimaryButton, ProgressBar } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";
import type { HouseholdProfile } from "../src/types";

export default function HouseholdScreen() {
  const household = useVoltStore((state) => state.household);
  const updateHousehold = useVoltStore((state) => state.updateHousehold);
  const [draft, setDraft] = useState<HouseholdProfile>(household);

  const completion = getCompletion(draft);

  function update<K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    updateHousehold(draft);
    Alert.alert("Household saved", "VOLT updated the offline plan and readiness rules.");
  }

  return (
    <AppShell>
      <ScreenHeader
        title="Household Profile"
        subtitle="Personalize alerts for your family"
        rightIcon={HelpCircle}
      />

      <Card tone="info">
        <View style={styles.noticeRow}>
          <UserPlus color={colors.primary} size={19} strokeWidth={2.4} />
          <Text style={styles.noticeText}>
            Sample profile is set to Talisay, Batangas with a grandmother who has asthma, one child,
            and no car.
          </Text>
        </View>
      </Card>

      <Card tone="chip">
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Profile completion</Text>
          <Text style={styles.progressValue}>{completion}%</Text>
        </View>
        <ProgressBar value={completion} />
      </Card>

      <Card tone="surface">
        <Text style={styles.cardTitle}>Location</Text>
        <Field label="Province" value={draft.province} onChangeText={(value) => update("province", value)} />
        <Field
          label="Municipality"
          value={draft.municipality}
          onChangeText={(value) => update("municipality", value)}
        />
        <Field label="Barangay" value={draft.barangay} onChangeText={(value) => update("barangay", value)} />
      </Card>

      <Card tone="surface">
        <Text style={styles.cardTitle}>Family needs</Text>
        <Stepper label="Family members" value={draft.householdSize} min={1} onChange={(value) => update("householdSize", value)} />
        <Stepper label="Elderly members" value={draft.elderlyMembers} onChange={(value) => update("elderlyMembers", value)} />
        <Stepper label="Children" value={draft.children} onChange={(value) => update("children", value)} />
        <Stepper label="Infants" value={draft.infants} onChange={(value) => update("infants", value)} />
        <ToggleRow
          label="Asthma or respiratory condition"
          value={draft.hasAsthmaOrRespiratory}
          onChange={(value) => update("hasAsthmaOrRespiratory", value)}
        />
        <ToggleRow
          label="Mobility limitation"
          value={draft.hasMobilityLimitations}
          onChange={(value) => update("hasMobilityLimitations", value)}
        />
        <ToggleRow
          label="Pregnant member"
          value={draft.hasPregnantMember}
          onChange={(value) => update("hasPregnantMember", value)}
        />
      </Card>

      <Card tone="surface">
        <Text style={styles.cardTitle}>Transport and contacts</Text>
        <Stepper label="Pets" value={draft.pets} onChange={(value) => update("pets", value)} />
        <ToggleRow
          label="Vehicle available"
          value={draft.hasVehicle}
          onChange={(value) => update("hasVehicle", value)}
        />
        <View style={styles.contactRow}>
          <Phone color={colors.primary} size={17} strokeWidth={2.4} />
          <View style={styles.contactCopy}>
            <Text style={styles.contactTitle}>Emergency contact</Text>
            <Text style={styles.contactText}>
              {draft.contacts[1]?.name ?? "Family contact"} - {draft.contacts[1]?.phone ?? "Add number"}
            </Text>
          </View>
        </View>
      </Card>

      <PrimaryButton label="Save Household Profile" icon={Save} onPress={save} />
    </AppShell>
  );
}

function getCompletion(profile: HouseholdProfile) {
  const fields = [
    profile.province,
    profile.municipality,
    profile.barangay,
    profile.householdSize > 0,
    profile.contacts.length > 0,
    profile.elderlyMembers >= 0,
    profile.children >= 0,
    profile.pets >= 0
  ];
  const complete = fields.filter(Boolean).length;
  return Math.round((complete / fields.length) * 100);
}

const styles = StyleSheet.create({
  noticeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  noticeText: {
    color: colors.primaryDark,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800"
  },
  progressValue: {
    color: colors.primary,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "900"
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21
  },
  contactRow: {
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12
  },
  contactCopy: {
    flex: 1,
    gap: 1
  },
  contactTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800"
  },
  contactText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 14
  }
});

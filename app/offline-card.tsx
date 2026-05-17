import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { RefreshCw, WifiOff } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton, SectionHeading } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";

export default function OfflineCardScreen() {
  const offlineCardSnapshot = useVoltStore((state) => state.offlineCardSnapshot);
  const refreshOfflineCard = useVoltStore((state) => state.refreshOfflineCard);
  const [refreshing, setRefreshing] = useState(false);
  const payload = offlineCardSnapshot?.payload;

  async function refreshSnapshot() {
    setRefreshing(true);
    await refreshOfflineCard();
    setRefreshing(false);
    Alert.alert("Emergency card saved", "A new offline snapshot was stored in SQLite.");
  }

  return (
    <AppShell>
      <ScreenHeader title="Emergency Card" subtitle="Offline mode saved for weak or no internet" rightIcon={WifiOff} />

      <Card tone="dark">
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Emergency Card</Text>
            <Text style={styles.heroText}>Saved locally on this phone through SQLite.</Text>
          </View>
          <Badge label="Offline" tone="dark" />
        </View>
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Saved location</Text>
          <Text style={styles.locationText}>
            {payload
              ? `${payload.household.barangay}, ${payload.household.municipality}, ${payload.household.province}`
              : "No saved snapshot yet"}
          </Text>
        </View>
      </Card>

      {payload ? (
        <>
          <Card tone="surface">
            <SectionHeading
              title="Checklist progress"
              action={<Badge label={`${payload.checklistProgress.percent}%`} tone="info" />}
            />
            <Text style={styles.sourceText}>
              {payload.checklistProgress.packed} of {payload.checklistProgress.total} items packed.
              Critical missing:{" "}
              {payload.checklistProgress.criticalMissing.length > 0
                ? payload.checklistProgress.criticalMissing.join(", ")
                : "none"}.
            </Text>
          </Card>

          <Card tone="surface">
            <SectionHeading title="Emergency contacts" />
            {payload.contacts.map((contact) => (
              <View style={styles.contactRow} key={contact.id}>
                <View style={styles.contactDot} />
                <View style={styles.contactCopy}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                </View>
                <Text style={styles.phone}>{contact.phone}</Text>
              </View>
            ))}
          </Card>

          <Card tone="surface">
            <Text style={styles.sectionTitle}>Barangay risk profile</Text>
            <Instruction
              text={`${payload.hazardProfile.barangay}, ${payload.hazardProfile.municipality}: ${payload.hazardProfile.distanceNote}`}
            />
            <Instruction
              text={`Ashfall: ${payload.hazardProfile.ashfall}. Gas: ${payload.hazardProfile.volcanicGas}. Lake hazard: ${payload.hazardProfile.lakeHazard}.`}
            />
            <Instruction text={payload.hazardProfile.evacuationNote} />
          </Card>

          <Card tone="surface">
            <Text style={styles.sectionTitle}>Latest local guidance</Text>
            <Text style={styles.sourceText}>{payload.latestGuidance.summary}</Text>
            {payload.latestGuidance.planActions.slice(0, 3).map((action) => (
              <Instruction key={action} text={action} />
            ))}
          </Card>

          <Card tone="warning">
            <Text style={styles.warningTitle}>Evacuation reminders</Text>
            <Instruction text="If LGU orders evacuation, leave immediately and bring the go-bag only." />
            <Instruction
              text={
                payload.household.hasVehicle
                  ? "Use the planned exit route."
                  : "Go to the barangay pickup point because no car is saved."
              }
            />
            <Instruction text={`Bring: ${payload.checklistProgress.criticalItems.join(", ")}.`} />
          </Card>

          <Card tone="surface">
            <Text style={styles.sectionTitle}>Household summary</Text>
            <Instruction
              text={`${payload.household.householdSize} people, ${payload.household.elderlyMembers} elderly, ${payload.household.children} children, ${payload.household.infants} infants.`}
            />
            <Instruction
              text={`Respiratory risk: ${
                payload.household.hasAsthmaOrRespiratory ? "yes" : "no"
              }. Pets: ${payload.household.pets}.`}
            />
          </Card>

          <Card tone="chip">
            <Text style={styles.timestamp}>Last saved: {formatDate(offlineCardSnapshot.createdAt)}</Text>
            <Text style={styles.sourceText}>Follow PHIVOLCS and local government instructions.</Text>
          </Card>
        </>
      ) : (
        <Card tone="warning">
          <Text style={styles.warningTitle}>No saved card yet</Text>
          <Text style={styles.sourceText}>Generate an offline snapshot to keep this card available after restart.</Text>
        </Card>
      )}

      <PrimaryButton
        label={refreshing ? "Saving card" : "Refresh saved card"}
        icon={RefreshCw}
        onPress={refreshSnapshot}
      />
    </AppShell>
  );
}

function Instruction({ text }: { text: string }) {
  return (
    <View style={styles.instruction}>
      <Text style={styles.square}>[ ]</Text>
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroCopy: {
    flex: 1,
    gap: 3
  },
  heroTitle: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 21,
    fontWeight: "800"
  },
  heroText: {
    color: "#D8EFF2",
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  locationBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: 10
  },
  locationLabel: {
    color: "#D8EFF2",
    fontFamily: font.medium,
    fontSize: 10,
    fontWeight: "800"
  },
  locationText: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "700"
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "900"
  },
  warningTitle: {
    color: "#6F4A00",
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "900"
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 48
  },
  contactDot: {
    backgroundColor: colors.critical,
    borderRadius: 8,
    height: 16,
    width: 16
  },
  contactCopy: {
    flex: 1,
    gap: 2
  },
  contactName: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "800"
  },
  contactRole: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11
  },
  phone: {
    color: colors.primary,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  instruction: {
    flexDirection: "row",
    gap: 7
  },
  square: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 16
  },
  instructionText: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16
  },
  timestamp: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800"
  },
  sourceText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15
  }
});

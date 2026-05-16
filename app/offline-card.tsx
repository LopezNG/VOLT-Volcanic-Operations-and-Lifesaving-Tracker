import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RefreshCw, WifiOff } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton, SectionHeading } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { buildReadinessPlan } from "../src/rules/planRules";
import { findHazardProfile } from "../src/services/bulletin";
import { useVoltStore } from "../src/store/useVoltStore";

export default function OfflineCardScreen() {
  const household = useVoltStore((state) => state.household);
  const bulletin = useVoltStore((state) => state.bulletin);
  const checklist = useVoltStore((state) => state.checklist);
  const offlineCardUpdatedAt = useVoltStore((state) => state.offlineCardUpdatedAt);
  const refreshOfflineCard = useVoltStore((state) => state.refreshOfflineCard);
  const hazard = useMemo(() => findHazardProfile(household), [household]);
  const plan = useMemo(() => buildReadinessPlan(household, hazard, bulletin), [household, hazard, bulletin]);
  const mustBring = checklist.filter((item) => item.urgency === "critical").slice(0, 4);

  return (
    <AppShell>
      <ScreenHeader title="Emergency Card" subtitle="Offline mode saved for weak or no internet" rightIcon={WifiOff} />

      <Card tone="dark">
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Emergency Card</Text>
            <Text style={styles.heroText}>Saved locally on this phone through AsyncStorage.</Text>
          </View>
          <Badge label="Offline" tone="dark" />
        </View>
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Saved location</Text>
          <Text style={styles.locationText}>
            {household.barangay}, {household.municipality}, {household.province}
          </Text>
        </View>
      </Card>

      <Card tone="surface">
        <SectionHeading title="Emergency contacts" />
        {household.contacts.map((contact) => (
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
        <Text style={styles.sectionTitle}>Household plan</Text>
        {plan
          .find((section) => section.id === "ashfall")
          ?.actions.slice(0, 3)
          .map((action) => (
            <Instruction key={action} text={action} />
          ))}
      </Card>

      <Card tone="warning">
        <Text style={styles.warningTitle}>Evacuation reminders</Text>
        <Instruction text="If LGU orders evacuation, leave immediately and bring the go-bag only." />
        <Instruction text={household.hasVehicle ? "Use the planned exit route." : "Go to the barangay pickup point because no car is saved."} />
        <Instruction text={`Bring: ${mustBring.map((item) => item.label).join(", ")}.`} />
      </Card>

      <Card tone="surface">
        <Text style={styles.sectionTitle}>Ashfall steps</Text>
        <Instruction text="Stay indoors, seal windows and doors, and keep masks available." />
        <Instruction text="Keep children, elderly members, pets, and asthma patients indoors." />
        <Instruction text="Avoid dry sweeping ash; dampen lightly when cleanup is advised." />
      </Card>

      <Card tone="chip">
        <Text style={styles.timestamp}>Last saved: {formatDate(offlineCardUpdatedAt)}</Text>
        <Text style={styles.sourceText}>Follow PHIVOLCS and local government instructions.</Text>
      </Card>

      <PrimaryButton label="Refresh saved card" icon={RefreshCw} onPress={refreshOfflineCard} />
    </AppShell>
  );
}

function Instruction({ text }: { text: string }) {
  return (
    <View style={styles.instruction}>
      <Text style={styles.square}>□</Text>
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

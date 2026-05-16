import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertOctagon,
  CheckCircle2,
  Cloudy,
  IdCard,
  ListChecks,
  Route,
  Shield,
  Wind
} from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton, ProgressBar, SectionHeading } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { buildReadinessPlan } from "../src/rules/planRules";
import { findHazardProfile } from "../src/services/bulletin";
import { useVoltStore } from "../src/store/useVoltStore";
import type { ReadinessSection } from "../src/types";

const sectionIcons = {
  normal: Shield,
  ashfall: Cloudy,
  gas: Wind,
  "evacuation-prep": Route,
  "evacuate-now": AlertOctagon
};

export default function PlanScreen() {
  const router = useRouter();
  const household = useVoltStore((state) => state.household);
  const bulletin = useVoltStore((state) => state.bulletin);
  const checklist = useVoltStore((state) => state.checklist);
  const hazard = useMemo(() => findHazardProfile(household), [household]);
  const plan = useMemo(() => buildReadinessPlan(household, hazard, bulletin), [household, hazard, bulletin]);
  const progress = Math.round((checklist.filter((item) => item.checked).length / checklist.length) * 100);

  return (
    <AppShell>
      <ScreenHeader
        title="Readiness Plan"
        subtitle={`${household.barangay}, ${household.municipality} household actions`}
        rightIcon={ListChecks}
        onRightPress={() => router.push("/checklist")}
      />

      <Card tone="dark">
        <View style={styles.heroTop}>
          <Badge label={`Alert Level ${bulletin.alertLevel}`} tone="warning" />
          <Badge label={hazard.ashfall} tone="dark" />
        </View>
        <Text style={styles.heroTitle}>Plan for ash, gas, and evacuation readiness</Text>
        <Text style={styles.heroText}>
          VOLT adapts official-source guidance to asthma risk, one child, one elderly member, pets,
          and no saved vehicle. It does not predict eruptions.
        </Text>
      </Card>

      <Card tone="surface">
        <SectionHeading title="Go-bag readiness" action={<Text style={styles.percent}>{progress}%</Text>} />
        <ProgressBar value={progress} />
        <View style={styles.buttonRow}>
          <PrimaryButton label="Open go-bag" icon={ListChecks} onPress={() => router.push("/checklist")} tone="light" />
          <PrimaryButton label="Emergency card" icon={IdCard} onPress={() => router.push("/offline-card")} />
        </View>
      </Card>

      {plan.map((section) => (
        <PlanSection key={section.id} section={section} />
      ))}
    </AppShell>
  );
}

function PlanSection({ section }: { section: ReadinessSection }) {
  const Icon = sectionIcons[section.id];
  const tone = section.tone === "critical" ? "critical" : section.tone === "warning" ? "warning" : section.tone === "info" ? "info" : "surface";

  return (
    <Card tone={tone}>
      <View style={styles.sectionHeader}>
        <Icon color={section.tone === "critical" ? colors.critical : colors.primary} size={19} strokeWidth={2.5} />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      {section.actions.map((action) => (
        <View style={styles.action} key={action}>
          <CheckCircle2 color={colors.primary} size={16} strokeWidth={2.4} />
          <Text style={styles.actionText}>{action}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroTitle: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22
  },
  heroText: {
    color: "#D8EFF2",
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  percent: {
    color: colors.primary,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "900"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  sectionTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "800"
  },
  action: {
    flexDirection: "row",
    gap: 8
  },
  actionText: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  }
});

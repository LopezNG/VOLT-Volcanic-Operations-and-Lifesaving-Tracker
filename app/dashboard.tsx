import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  IdCard,
  MapPin,
  Radio,
  RefreshCw,
  ShieldCheck,
  Siren,
  UsersRound,
  Wind
} from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { ActionRow, Badge, Card, PrimaryButton, SectionHeading } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import { getImmediateActions } from "../src/rules/planRules";
import { findHazardProfile } from "../src/services/bulletin";
import { useVoltStore } from "../src/store/useVoltStore";

export default function DashboardScreen() {
  const router = useRouter();
  const household = useVoltStore((state) => state.household);
  const bulletin = useVoltStore((state) => state.bulletin);
  const checklist = useVoltStore((state) => state.checklist);
  const checkIn = useVoltStore((state) => state.checkIn);
  const hazardProfiles = useVoltStore((state) => state.hazardProfiles);
  const hazard = useMemo(
    () => findHazardProfile(household, hazardProfiles),
    [household, hazardProfiles]
  );
  const actions = useMemo(() => getImmediateActions(household, hazard), [household, hazard]);
  const missingCritical = checklist.filter((item) => item.urgency === "critical" && !item.checked).length;
  const packedCount = checklist.filter((item) => item.checked).length;

  return (
    <AppShell>
      <ScreenHeader
        title="Risk Dashboard"
        subtitle="PHIVOLCS and Batangas LGU synced 16 May, 06:12"
        rightIcon={Bell}
        onRightPress={() => router.push("/settings")}
      />

      <Card tone="dark">
        <View style={styles.riskTop}>
          <Badge label="PHIVOLCS" tone="dark" />
          <Badge label={`Alert Level ${bulletin.alertLevel}`} tone="warning" />
        </View>
        <Text style={styles.heroTitle}>Elevated unrest near Taal</Text>
        <Text style={styles.heroText}>{bulletin.summary}</Text>
        <PrimaryButton
          label="Open latest bulletin"
          icon={Radio}
          onPress={() => router.push("/bulletin")}
          tone="light"
        />
      </Card>

      <View style={styles.metrics}>
        <Metric icon={AlertTriangle} label="Ashfall" value={hazard.ashfall} tone="warning" />
        <Metric icon={ShieldCheck} label="Gas" value={hazard.volcanicGas} tone="success" />
        <Metric icon={Wind} label="Wind" value="SW" tone="info" />
      </View>

      <Card tone="surface">
        <View style={styles.zoneRow}>
          <View style={styles.zoneIcon}>
            <MapPin color={colors.primary} size={19} strokeWidth={2.3} />
          </View>
          <View style={styles.zoneCopy}>
            <Text style={styles.zoneTitle}>Barangay risk profile</Text>
            <Text style={styles.zoneText}>
              {household.barangay}, {household.municipality}. {hazard.distanceNote}
            </Text>
          </View>
          <Text style={styles.readyText}>READY</Text>
        </View>
      </Card>

      <View style={styles.quickGrid}>
        <Pressable style={styles.quickCard} onPress={() => router.push("/checklist")}>
          <ClipboardList color={colors.primary} size={20} strokeWidth={2.4} />
          <Text style={styles.quickValue}>
            {packedCount}/{checklist.length}
          </Text>
          <Text style={styles.quickLabel}>Go-bag packed</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push("/check-in")}>
          <UsersRound color={colors.primary} size={20} strokeWidth={2.4} />
          <Text style={styles.quickValue}>{checkIn ? statusLabel(checkIn.status) : "Not set"}</Text>
          <Text style={styles.quickLabel}>Family check-in</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeading title="What to do now" />
        {actions.map((action, index) => (
          <ActionRow
            key={action}
            icon={index === 0 ? CheckCircle2 : index === 1 ? AlertTriangle : Siren}
            title={action}
            tone={index === 1 || missingCritical > 0 ? "warning" : "surface"}
            checked={index === 0 && missingCritical === 0}
            onPress={() => router.push(index === 1 ? "/checklist" : "/plan")}
          />
        ))}
      </View>

      <Card tone="chip">
        <View style={styles.syncRow}>
          <RefreshCw color={colors.primary} size={18} strokeWidth={2.3} />
          <View style={styles.zoneCopy}>
            <Text style={styles.syncTitle}>Offline cache ready</Text>
            <Text style={styles.zoneText}>
              Emergency card, profile, checklist, and check-in persist on this phone.
            </Text>
          </View>
          <Pressable onPress={() => router.push("/offline-card")} style={styles.cardLink}>
            <IdCard color={colors.primary} size={17} strokeWidth={2.4} />
          </Pressable>
        </View>
      </Card>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
  tone: "warning" | "success" | "info";
}) {
  const styleMap = {
    warning: styles.metricWarning,
    success: styles.metricSuccess,
    info: styles.metricInfo
  };

  return (
    <View style={[styles.metric, styleMap[tone]]}>
      <Icon color={tone === "warning" ? "#6F4A00" : colors.primary} size={17} strokeWidth={2.4} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    safe: "Safe",
    "need-help": "Needs help",
    evacuating: "Moving",
    "at-shelter": "Shelter"
  };
  return labels[status] ?? "Saved";
}

const styles = StyleSheet.create({
  riskTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroTitle: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 22
  },
  heroText: {
    color: "#D8EFF2",
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  metrics: {
    flexDirection: "row",
    gap: 8,
    height: 78
  },
  metric: {
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    padding: 8
  },
  metricWarning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning
  },
  metricSuccess: {
    backgroundColor: colors.successBg,
    borderColor: colors.success
  },
  metricInfo: {
    backgroundColor: colors.infoBg,
    borderColor: colors.subtle
  },
  metricValue: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 14,
    fontWeight: "800"
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  zoneRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  zoneIcon: {
    alignItems: "center",
    backgroundColor: colors.chip,
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  zoneCopy: {
    flex: 1,
    gap: 3
  },
  zoneTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "800"
  },
  zoneText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 14
  },
  readyText: {
    color: colors.success,
    fontFamily: font.medium,
    fontSize: 10,
    fontWeight: "900"
  },
  quickGrid: {
    flexDirection: "row",
    gap: 8
  },
  quickCard: {
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 86,
    padding: 10
  },
  quickValue: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 17,
    fontWeight: "900"
  },
  quickLabel: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    fontWeight: "600"
  },
  section: {
    gap: 6
  },
  syncRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  syncTitle: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800"
  },
  cardLink: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    height: 34,
    justifyContent: "center",
    width: 34
  }
});

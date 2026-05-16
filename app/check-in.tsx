import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  HeartPulse,
  Home,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Route,
  UsersRound
} from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";
import type { CheckInStatus } from "../src/types";

const statusOptions: {
  status: CheckInStatus;
  label: string;
  detail: string;
  icon: typeof HeartPulse;
  tone: "success" | "critical" | "warning" | "info";
}[] = [
  { status: "safe", label: "I'm safe", detail: "At home or with family", icon: HeartPulse, tone: "success" },
  { status: "need-help", label: "Need help", detail: "Ask contacts or responders", icon: LifeBuoy, tone: "critical" },
  { status: "evacuating", label: "Evacuating", detail: "Moving to pickup or shelter", icon: Route, tone: "warning" },
  { status: "at-shelter", label: "At shelter", detail: "Arrived and waiting", icon: Home, tone: "info" }
];

export default function CheckInScreen() {
  const household = useVoltStore((state) => state.household);
  const checkIn = useVoltStore((state) => state.checkIn);
  const saveCheckIn = useVoltStore((state) => state.saveCheckIn);

  return (
    <AppShell>
      <ScreenHeader title="Family Check-In" subtitle="Save a low-bandwidth status locally" rightIcon={UsersRound} />

      <View style={styles.grid}>
        {statusOptions.map((option) => {
          const selected = checkIn?.status === option.status;
          const Icon = option.icon;

          return (
            <PrimaryButton
              key={option.status}
              label={option.label}
              icon={Icon}
              tone={selected ? "primary" : option.tone === "critical" ? "danger" : "light"}
              onPress={() => saveCheckIn(option.status)}
            />
          );
        })}
      </View>

      <Card tone="info">
        <View style={styles.noteRow}>
          <MessageSquare color={colors.primary} size={18} strokeWidth={2.5} />
          <Text style={styles.noteText}>
            VOLT saves your latest status on this phone. A backend can later send SMS first, then
            sync when internet returns.
          </Text>
        </View>
      </Card>

      <Card tone="surface">
        <View style={styles.latestTop}>
          <Text style={styles.sectionTitle}>Latest check-in</Text>
          <Badge label={checkIn ? "Saved" : "Unset"} tone={checkIn ? "success" : "warning"} />
        </View>
        <Text style={styles.statusText}>{checkIn ? statusCopy(checkIn.status) : "No check-in yet."}</Text>
        <TextInput
          editable={false}
          value={checkIn?.note || "Optional note can be added in a backend-enabled version."}
          style={styles.noteInput}
          multiline
        />
        <Text style={styles.updatedText}>
          {checkIn ? `Updated ${formatDate(checkIn.updatedAt)}` : "Use one status button above."}
        </Text>
      </Card>

      <Card tone="surface">
        <Text style={styles.sectionTitle}>Household contacts</Text>
        {household.contacts.map((contact) => (
          <View style={styles.contactRow} key={contact.id}>
            <MapPin color={colors.primary} size={17} strokeWidth={2.3} />
            <View style={styles.contactCopy}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactRole}>{contact.role}</Text>
            </View>
            <Text style={styles.phone}>{contact.phone}</Text>
          </View>
        ))}
      </Card>
    </AppShell>
  );
}

function statusCopy(status: CheckInStatus) {
  const labels = {
    safe: "I'm safe",
    "need-help": "Need help",
    evacuating: "Evacuating",
    "at-shelter": "At shelter"
  };

  return labels[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  grid: {
    gap: 8
  },
  noteRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  noteText: {
    color: colors.primaryDark,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16
  },
  latestTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "900"
  },
  statusText: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 18,
    fontWeight: "900"
  },
  noteInput: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    minHeight: 58,
    padding: 10
  },
  updatedText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15
  },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 48
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
  }
});

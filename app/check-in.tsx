import { useState } from "react";
import { Alert, ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
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
import { sendCheckInSms } from "../src/services/checkInSms";
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
  const [note, setNote] = useState(checkIn?.note ?? "");
  const [sendingStatus, setSendingStatus] = useState<CheckInStatus | undefined>();
  const [fallbackMessage, setFallbackMessage] = useState<string | undefined>();

  async function sendStatus(status: CheckInStatus) {
    const timestamp = new Date().toISOString();
    setSendingStatus(status);

    try {
      const result = await sendCheckInSms({
        status,
        note,
        household,
        contacts: household.contacts,
        timestamp
      });

      await saveCheckIn(status, note, {
        message: result.message,
        recipientContactIds: result.recipientContactIds,
        smsAvailable: result.smsAvailable,
        smsResult: result.smsResult,
        updatedAt: timestamp
      });

      if (!result.smsAvailable) {
        setFallbackMessage(result.message);
        Alert.alert(
          "SMS composer unavailable",
          "VOLT saved the check-in and prepared a message you can copy from this screen."
        );
      } else {
        setFallbackMessage(undefined);
        Alert.alert("Check-in saved", "VOLT opened your SMS composer and saved the event locally.");
      }
    } catch (error) {
      Alert.alert(
        "Check-in saved locally failed",
        error instanceof Error ? error.message : "The SMS composer could not be opened."
      );
    } finally {
      setSendingStatus(undefined);
    }
  }

  return (
    <AppShell>
      <ScreenHeader title="Family Check-In" subtitle="Send SMS and save the event locally" rightIcon={UsersRound} />

      <View style={styles.grid}>
        {statusOptions.map((option) => {
          const selected = checkIn?.status === option.status;
          const Icon = option.icon;

          return (
            <PrimaryButton
              key={option.status}
              label={sendingStatus === option.status ? "Opening SMS" : option.label}
              icon={Icon}
              tone={selected ? "primary" : option.tone === "critical" ? "danger" : "light"}
              onPress={() => sendStatus(option.status)}
            />
          );
        })}
      </View>

      <Card tone="info">
        <View style={styles.noteRow}>
          <MessageSquare color={colors.primary} size={18} strokeWidth={2.5} />
          <Text style={styles.noteText}>
            VOLT opens your phone's SMS composer using saved contacts, then stores the check-in
            event in SQLite on this phone.
          </Text>
        </View>
      </Card>

      {sendingStatus ? (
        <Card tone="chip">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.noteText}>Preparing SMS message...</Text>
          </View>
        </Card>
      ) : null}

      <Card tone="surface">
        <View style={styles.latestTop}>
          <Text style={styles.sectionTitle}>Latest check-in</Text>
          <Badge label={checkIn ? "Saved" : "Unset"} tone={checkIn ? "success" : "warning"} />
        </View>
        <Text style={styles.statusText}>{checkIn ? statusCopy(checkIn.status) : "No check-in yet."}</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Optional note, shelter name, pickup point, or urgent detail"
          placeholderTextColor={colors.muted}
          style={styles.noteInput}
          multiline
        />
        <Text style={styles.updatedText}>
          {checkIn ? `Updated ${formatDate(checkIn.updatedAt)}` : "Use one status button above."}
        </Text>
      </Card>

      {fallbackMessage ? (
        <Card tone="warning">
          <Text style={styles.sectionTitle}>Copy fallback message</Text>
          <Text selectable style={styles.fallbackText}>
            {fallbackMessage}
          </Text>
        </Card>
      ) : null}

      <Card tone="surface">
        <Text style={styles.sectionTitle}>Household contacts</Text>
        {household.contacts.length > 0 ? (
          household.contacts.map((contact) => (
            <View style={styles.contactRow} key={contact.id}>
              <MapPin color={colors.primary} size={17} strokeWidth={2.3} />
              <View style={styles.contactCopy}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRole}>{contact.role}</Text>
              </View>
              <Text style={styles.phone}>{contact.phone}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.updatedText}>Add contacts in Household Profile before sending SMS.</Text>
        )}
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
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
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
  fallbackText: {
    color: "#6F4A00",
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
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

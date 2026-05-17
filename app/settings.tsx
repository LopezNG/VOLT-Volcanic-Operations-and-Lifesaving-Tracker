import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Bell, BellOff, Clock, ShieldCheck } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Stepper } from "../src/components/forms";
import { Badge, Card, PrimaryButton } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { requestLocalNotificationPermissions } from "../src/services/notifications";
import { useVoltStore } from "../src/store/useVoltStore";
import type { NotificationPreference } from "../src/types";

export default function SettingsScreen() {
  const preferences = useVoltStore((state) => state.notificationPreferences);
  const updateNotificationPreference = useVoltStore((state) => state.updateNotificationPreference);
  const scheduleReminder = useVoltStore((state) => state.scheduleReminder);
  const cancelReminder = useVoltStore((state) => state.cancelReminder);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [busyReminder, setBusyReminder] = useState<string | undefined>();

  async function requestPermission() {
    setPermissionBusy(true);
    const granted = await requestLocalNotificationPermissions();
    setPermissionBusy(false);
    Alert.alert(
      granted ? "Notifications enabled" : "Notifications not enabled",
      granted
        ? "VOLT can schedule local reminders on this phone."
        : "Permission was not granted. You can still use VOLT without reminders."
    );
  }

  async function schedule(preference: NotificationPreference) {
    setBusyReminder(preference.id);
    try {
      await scheduleReminder(preference.id);
      Alert.alert("Reminder scheduled", `${preference.title} is now scheduled locally.`);
    } catch (error) {
      Alert.alert(
        "Reminder not scheduled",
        error instanceof Error ? error.message : "VOLT could not schedule this reminder."
      );
    } finally {
      setBusyReminder(undefined);
    }
  }

  async function cancel(preference: NotificationPreference) {
    setBusyReminder(preference.id);
    try {
      await cancelReminder(preference.id);
      Alert.alert("Reminder canceled", `${preference.title} was canceled.`);
    } finally {
      setBusyReminder(undefined);
    }
  }

  return (
    <AppShell>
      <ScreenHeader title="Settings" subtitle="Local reminders and Expo-first options" rightIcon={ShieldCheck} />

      <Card tone="info">
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.bodyText}>
          VOLT uses local notifications only in this phase. Remote push is reserved for a future
          EAS/dev-build backend phase.
        </Text>
        <PrimaryButton
          label={permissionBusy ? "Requesting" : "Request Permission"}
          icon={Bell}
          onPress={requestPermission}
        />
      </Card>

      {preferences.map((preference) => (
        <ReminderCard
          key={preference.id}
          preference={preference}
          busy={busyReminder === preference.id}
          onChange={updateNotificationPreference}
          onSchedule={() => schedule(preference)}
          onCancel={() => cancel(preference)}
        />
      ))}
    </AppShell>
  );
}

function ReminderCard({
  preference,
  busy,
  onChange,
  onSchedule,
  onCancel
}: {
  preference: NotificationPreference;
  busy: boolean;
  onChange: (preference: NotificationPreference) => Promise<void>;
  onSchedule: () => void;
  onCancel: () => void;
}) {
  return (
    <Card tone="surface">
      <View style={styles.reminderHeader}>
        <View style={styles.reminderTitleRow}>
          <Clock color={colors.primary} size={18} strokeWidth={2.4} />
          <Text style={styles.sectionTitle}>{preference.title}</Text>
        </View>
        <Badge label={preference.enabled ? "On" : "Off"} tone={preference.enabled ? "success" : "warning"} />
      </View>

      <Stepper
        label="Hour"
        min={0}
        max={23}
        value={preference.hour}
        onChange={(hour) => onChange({ ...preference, hour })}
      />
      <Stepper
        label="Minute"
        min={0}
        max={59}
        value={preference.minute}
        onChange={(minute) => onChange({ ...preference, minute })}
      />

      <Text style={styles.bodyText}>
        Scheduled time: {preference.hour.toString().padStart(2, "0")}:
        {preference.minute.toString().padStart(2, "0")}
      </Text>

      {preference.enabled ? (
        <PrimaryButton
          label={busy ? "Canceling" : "Cancel Reminder"}
          icon={BellOff}
          onPress={onCancel}
          tone="light"
        />
      ) : (
        <PrimaryButton
          label={busy ? "Scheduling" : "Schedule Reminder"}
          icon={Bell}
          onPress={onSchedule}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  reminderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  reminderTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8
  }
});

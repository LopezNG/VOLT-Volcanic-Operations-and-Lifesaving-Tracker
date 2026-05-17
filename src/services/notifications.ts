import { Platform } from "react-native";
import { cancelScheduledNotificationAsync } from "expo-notifications/build/cancelScheduledNotificationAsync";
import { addNotificationResponseReceivedListener } from "expo-notifications/build/NotificationsEmitter";
import { setNotificationHandler } from "expo-notifications/build/NotificationsHandler";
import {
  AndroidImportance,
  type NotificationChannelInput
} from "expo-notifications/build/NotificationChannelManager.types";
import {
  getPermissionsAsync,
  requestPermissionsAsync
} from "expo-notifications/build/NotificationPermissions";
import {
  SchedulableTriggerInputTypes,
  type NotificationBehavior
} from "expo-notifications/build/Notifications.types";
import { scheduleNotificationAsync } from "expo-notifications/build/scheduleNotificationAsync";
import { setNotificationChannelAsync } from "expo-notifications/build/setNotificationChannelAsync";

import type { NotificationPreference, NotificationReminderId } from "../types";

const CHANNEL_ID = "volt-local-reminders";
let androidChannelReady = false;

const reminderCopy: Record<NotificationReminderId, { body: string; screen: string }> = {
  "go-bag": {
    body: "Check masks, medicines, water, IDs, light, radio, cash, and phone power.",
    screen: "/checklist"
  },
  bulletin: {
    body: "Review the saved Taal bulletin and official-source reminder.",
    screen: "/bulletin"
  }
};

setNotificationHandler({
  handleNotification: async (): Promise<NotificationBehavior> => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function configureLocalNotifications() {
  await ensureAndroidNotificationChannel();
  // TODO: Add remote push token registration only in a future EAS/dev-build phase.
}

export async function requestLocalNotificationPermissions() {
  await ensureAndroidNotificationChannel();
  const existing = await getPermissionsAsync();

  if (existing.granted) {
    return true;
  }

  const requested = await requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleLocalReminder(preference: NotificationPreference) {
  const granted = await requestLocalNotificationPermissions();

  if (!granted) {
    throw new Error("Notification permission was not granted.");
  }

  const copy = reminderCopy[preference.id];

  return scheduleNotificationAsync({
    content: {
      title: preference.title,
      body: copy.body,
      sound: "default",
      data: {
        screen: copy.screen,
        reminderId: preference.id
      }
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: preference.hour,
      minute: preference.minute,
      ...(androidChannelReady ? { channelId: CHANNEL_ID } : {})
    }
  });
}

export async function cancelLocalReminder(notificationId?: string) {
  if (!notificationId) {
    return;
  }

  await cancelScheduledNotificationAsync(notificationId);
}

export function addNotificationTapListener(navigate: (screen: string) => void) {
  return addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;

    if (typeof screen === "string" && screen.startsWith("/")) {
      navigate(screen);
    }
  });
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return true;
  }

  if (androidChannelReady) {
    return true;
  }

  const channel: NotificationChannelInput = {
    name: "VOLT local reminders",
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#0B4F5A"
  };

  try {
    await setNotificationChannelAsync(CHANNEL_ID, channel);
    androidChannelReady = true;
    return true;
  } catch (error) {
    androidChannelReady = false;
    console.warn(
      "VOLT local notification channel could not be created in this Expo Go runtime.",
      error
    );
    return false;
  }
}

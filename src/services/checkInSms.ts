import * as SMS from "expo-sms";

import type { CheckInStatus, EmergencyContact, HouseholdProfile } from "../types";

const statusLabels: Record<CheckInStatus, string> = {
  safe: "I'm safe",
  "need-help": "Need help",
  evacuating: "Evacuating",
  "at-shelter": "At shelter"
};

export interface CheckInSmsResult {
  message: string;
  recipientContactIds: string[];
  recipients: string[];
  smsAvailable: boolean;
  smsResult?: string;
}

export async function sendCheckInSms({
  status,
  note,
  household,
  contacts,
  timestamp = new Date().toISOString()
}: {
  status: CheckInStatus;
  note: string;
  household: HouseholdProfile;
  contacts: EmergencyContact[];
  timestamp?: string;
}): Promise<CheckInSmsResult> {
  const message = buildCheckInMessage({ status, note, household, timestamp });
  const usableContacts = contacts
    .map((contact) => ({ contact, phone: normalizePhoneNumber(contact.phone) }))
    .filter((entry) => entry.phone.length >= 3);
  const recipients = usableContacts.map((entry) => entry.phone);
  const recipientContactIds = usableContacts.map((entry) => entry.contact.id);
  const smsAvailable = await SMS.isAvailableAsync();

  if (!smsAvailable || recipients.length === 0) {
    return {
      message,
      recipientContactIds,
      recipients,
      smsAvailable: false,
      smsResult: recipients.length === 0 ? "no-recipients" : "unavailable"
    };
  }

  const response = await openSmsComposer(recipients, message);

  return {
    message,
    recipientContactIds,
    recipients,
    smsAvailable,
    smsResult: response.result
  };
}

export function buildCheckInMessage({
  status,
  note,
  household,
  timestamp
}: {
  status: CheckInStatus;
  note: string;
  household: HouseholdProfile;
  timestamp: string;
}) {
  const location = [household.barangay, household.municipality, household.province]
    .filter(Boolean)
    .join(", ");
  const noteLine = note.trim() ? ` Note: ${note.trim()}` : "";
  const locationLine = location ? ` Location: ${location}.` : "";

  return `VOLT family check-in: ${statusLabels[status]}. Time: ${formatSmsTimestamp(
    timestamp
  )}.${locationLine}${noteLine}`;
}

async function openSmsComposer(recipients: string[], message: string) {
  const smsModule = SMS as typeof SMS & {
    composeAsync?: (options: { recipients: string[]; message: string }) => Promise<SMS.SMSResponse>;
  };

  if (smsModule.composeAsync) {
    return smsModule.composeAsync({ recipients, message });
  }

  return SMS.sendSMSAsync(recipients, message);
}

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  }

  return trimmed.replace(/\D/g, "");
}

function formatSmsTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

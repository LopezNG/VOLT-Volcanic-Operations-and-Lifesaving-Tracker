import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { HelpCircle, Pencil, Phone, Save, Trash2, UserPlus, X } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Field, Stepper, ToggleRow } from "../src/components/forms";
import { Card, PrimaryButton, ProgressBar } from "../src/components/ui";
import { colors, font } from "../src/constants/theme";
import { useVoltStore } from "../src/store/useVoltStore";
import type { EmergencyContact, HouseholdProfile } from "../src/types";

const emptyContactDraft = {
  name: "",
  role: "",
  phone: ""
};

export default function HouseholdScreen() {
  const household = useVoltStore((state) => state.household);
  const updateHousehold = useVoltStore((state) => state.updateHousehold);
  const addContact = useVoltStore((state) => state.addContact);
  const updateContact = useVoltStore((state) => state.updateContact);
  const deleteContact = useVoltStore((state) => state.deleteContact);
  const [draft, setDraft] = useState<HouseholdProfile>(household);
  const [contactDraft, setContactDraft] = useState(emptyContactDraft);
  const [editingContactId, setEditingContactId] = useState<string | undefined>();

  useEffect(() => {
    setDraft(household);
  }, [household]);

  const completion = getCompletion({ ...draft, contacts: household.contacts });

  function update<K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    await updateHousehold({ ...draft, contacts: household.contacts });
    Alert.alert("Household saved", "VOLT updated the offline plan and readiness rules.");
  }

  async function saveContact() {
    const nextContact = {
      name: contactDraft.name.trim(),
      role: contactDraft.role.trim() || "Emergency contact",
      phone: contactDraft.phone.trim()
    };

    if (!nextContact.name || !nextContact.phone) {
      Alert.alert("Contact needs a name and phone", "Add both before saving this contact.");
      return;
    }

    if (editingContactId) {
      await updateContact({ ...nextContact, id: editingContactId });
    } else {
      await addContact(nextContact);
    }

    clearContactDraft();
  }

  function beginEditContact(contact: EmergencyContact) {
    setEditingContactId(contact.id);
    setContactDraft({
      name: contact.name,
      role: contact.role,
      phone: contact.phone
    });
  }

  function confirmDeleteContact(contact: EmergencyContact) {
    Alert.alert("Delete contact?", `${contact.name} will be removed from Family Check-In.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteContact(contact.id)
      }
    ]);
  }

  function clearContactDraft() {
    setEditingContactId(undefined);
    setContactDraft(emptyContactDraft);
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
            This profile is saved locally on this phone and used for offline guidance, check-ins,
            and emergency card snapshots.
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
            <Text style={styles.contactTitle}>Primary emergency contact</Text>
            <Text style={styles.contactText}>
              {household.contacts[0]?.name ?? "No contact yet"} - {household.contacts[0]?.phone ?? "Add number below"}
            </Text>
          </View>
        </View>
      </Card>

      <Card tone="surface">
        <Text style={styles.cardTitle}>Emergency contacts</Text>
        {household.contacts.length > 0 ? (
          household.contacts.map((contact) => (
            <View style={styles.savedContactRow} key={contact.id}>
              <View style={styles.contactCopy}>
                <Text style={styles.contactTitle}>{contact.name}</Text>
                <Text style={styles.contactText}>
                  {contact.role} - {contact.phone}
                </Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => beginEditContact(contact)}>
                <Pencil color={colors.primary} size={15} strokeWidth={2.4} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => confirmDeleteContact(contact)}>
                <Trash2 color={colors.critical} size={15} strokeWidth={2.4} />
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.contactText}>Add at least one contact for SMS check-ins.</Text>
        )}
      </Card>

      <Card tone="chip">
        <View style={styles.formHeader}>
          <Text style={styles.cardTitle}>{editingContactId ? "Edit contact" : "Add contact"}</Text>
          {editingContactId ? (
            <Pressable style={styles.iconButton} onPress={clearContactDraft}>
              <X color={colors.primary} size={15} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
        <Field
          label="Name"
          value={contactDraft.name}
          onChangeText={(value) => setContactDraft((current) => ({ ...current, name: value }))}
          placeholder="Family member, LGU, neighbor"
        />
        <Field
          label="Role"
          value={contactDraft.role}
          onChangeText={(value) => setContactDraft((current) => ({ ...current, role: value }))}
          placeholder="Family contact"
        />
        <Field
          label="Phone"
          value={contactDraft.phone}
          onChangeText={(value) => setContactDraft((current) => ({ ...current, phone: value }))}
          placeholder="0917 000 0000"
        />
        <PrimaryButton
          label={editingContactId ? "Save Contact" : "Add Contact"}
          icon={UserPlus}
          onPress={saveContact}
          tone="light"
        />
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
  },
  savedContactRow: {
    alignItems: "center",
    borderBottomColor: colors.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 48,
    paddingVertical: 6
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  formHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

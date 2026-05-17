import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Share2, Sparkles, Upload, WandSparkles } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton, SectionHeading } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import { explainBulletinWithMockAi } from "../src/services/ai";
import { findHazardProfile } from "../src/services/bulletin";
import { useVoltStore } from "../src/store/useVoltStore";
import type { ExplainerOutput } from "../src/types";

export default function BulletinScreen() {
  const household = useVoltStore((state) => state.household);
  const bulletin = useVoltStore((state) => state.bulletin);
  const hazardProfiles = useVoltStore((state) => state.hazardProfiles);
  const savedExplainer = useVoltStore((state) => state.explainer);
  const saveExplainer = useVoltStore((state) => state.saveExplainer);
  const [text, setText] = useState(bulletin.technicalText);
  const [output, setOutput] = useState<ExplainerOutput | undefined>(savedExplainer);
  const [loading, setLoading] = useState(false);
  const hazard = useMemo(
    () => findHazardProfile(household, hazardProfiles),
    [household, hazardProfiles]
  );

  async function explain() {
    setLoading(true);
    const result = await explainBulletinWithMockAi({
      bulletinText: text.trim() || bulletin.technicalText,
      bulletin,
      household,
      hazard
    });
    await saveExplainer(result);
    setOutput(result);
    setLoading(false);
  }

  return (
    <AppShell>
      <ScreenHeader title="AI Bulletin Explainer" subtitle="Plain-language guide from official text" rightIcon={Share2} />

      <Card tone="surface">
        <View style={styles.sourceTop}>
          <Badge label={bulletin.source} tone="info" />
          <Badge label={`Level ${bulletin.alertLevel}`} tone="warning" />
        </View>
        <Text style={styles.sourceTitle}>{bulletin.title}</Text>
        <Text style={styles.sourceNote}>
          AI explains terms; PHIVOLCS and LGU advisories remain the source of truth.
        </Text>
      </Card>

      <Card tone="dark">
        <View style={styles.aiLabel}>
          <Sparkles color={colors.warning} size={18} strokeWidth={2.5} />
          <Text style={styles.aiTitle}>Mock backend explainer</Text>
        </View>
        <Text style={styles.aiSummary}>
          Paste a PHIVOLCS-style bulletin or load the sample. VOLT will explain what it means
          without predicting eruptions or inventing alert levels.
        </Text>
      </Card>

      <Card tone="surface">
        <SectionHeading
          title="Official bulletin text"
          action={<Badge label={text.trim() ? "Ready" : "Empty"} tone={text.trim() ? "success" : "warning"} />}
        />
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          placeholder="Paste official bulletin text here"
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
        <View style={styles.buttonRow}>
          <PrimaryButton label="Load sample" icon={Upload} onPress={() => setText(bulletin.technicalText)} tone="light" />
          <PrimaryButton label={loading ? "Explaining" : "Explain"} icon={WandSparkles} onPress={explain} />
        </View>
      </Card>

      {loading ? (
        <Card tone="chip">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Preparing a cached plain-language summary...</Text>
          </View>
        </Card>
      ) : null}

      {output ? (
        <View style={styles.output}>
          <ExplainerSection title="What happened" items={output.whatHappened} />
          <ExplainerSection title="What it means" items={output.whatItMeans} />
          <ExplainerSection title="What to avoid" items={output.whatToAvoid} tone="warning" />
          <ExplainerSection title="What to prepare" items={output.whatToPrepare} />
          <ExplainerSection title="Who is most at risk" items={output.mostAtRisk} tone="critical" />
          <Card tone="info">
            <Text style={styles.sourceNote}>{output.uncertainty}</Text>
            <Text style={styles.reminder}>{output.sourceReminder}</Text>
          </Card>
        </View>
      ) : null}
    </AppShell>
  );
}

function ExplainerSection({
  title,
  items,
  tone = "surface"
}: {
  title: string;
  items: string[];
  tone?: "surface" | "warning" | "critical";
}) {
  return (
    <Card tone={tone}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View style={styles.item} key={item}>
          <View style={styles.dot} />
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  sourceTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sourceTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19
  },
  sourceNote: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15
  },
  aiLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  aiTitle: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 13,
    fontWeight: "800"
  },
  aiSummary: {
    color: "#D8EFF2",
    fontFamily: font.regular,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17
  },
  textArea: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16,
    minHeight: 142,
    padding: 10
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  loadingText: {
    color: colors.primaryDark,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "600"
  },
  output: {
    gap: 10
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "800"
  },
  item: {
    flexDirection: "row",
    gap: 8
  },
  dot: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: 6,
    marginTop: 5,
    width: 6
  },
  itemText: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  reminder: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  }
});

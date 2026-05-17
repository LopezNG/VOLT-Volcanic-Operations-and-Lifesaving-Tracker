import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, ExternalLink, Radio, RefreshCw, ShieldAlert } from "lucide-react-native";

import { AppShell, ScreenHeader } from "../src/components/AppShell";
import { Badge, Card, PrimaryButton, SectionHeading } from "../src/components/ui";
import { colors, font, radii } from "../src/constants/theme";
import {
  useExplainLatestTaalBulletin,
  useLatestTaalBulletin
} from "../src/hooks/useTaalBulletins";
import { TAAL_BULLETIN_API_BASE_URL } from "../src/services/taalBulletinApi";
import type { TaalBulletin, TaalBulletinExplanation } from "../src/services/taalBulletinApi";

export default function BulletinScreen() {
  const latestQuery = useLatestTaalBulletin();
  const explanationQuery = useExplainLatestTaalBulletin();
  const bulletin = latestQuery.data;
  const explanation = normalizeExplanation(explanationQuery.data, bulletin);
  const isRefreshing = latestQuery.isFetching || explanationQuery.isFetching;

  function refresh() {
    void latestQuery.refetch();
    void explanationQuery.refetch();
  }

  return (
    <AppShell>
      <ScreenHeader
        title="Taal Bulletin"
        subtitle="Latest PHIVOLCS bulletin through VOLT backend"
        rightIcon={RefreshCw}
        onRightPress={refresh}
      />

      {latestQuery.isLoading ? (
        <Card tone="chip">
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Fetching the latest PHIVOLCS bulletin...</Text>
          </View>
        </Card>
      ) : null}

      {latestQuery.isError ? (
        <Card tone="critical">
          <View style={styles.errorTop}>
            <AlertTriangle color={colors.critical} size={18} strokeWidth={2.4} />
            <Text style={styles.errorTitle}>Unable to load latest bulletin</Text>
          </View>
          <Text style={styles.errorText}>{getErrorMessage(latestQuery.error)}</Text>
          <Text style={styles.configText}>Backend base URL: {TAAL_BULLETIN_API_BASE_URL}</Text>
          <PrimaryButton label="Try again" icon={RefreshCw} onPress={refresh} tone="danger" />
        </Card>
      ) : null}

      {bulletin ? (
        <>
          <Card tone="dark">
            <View style={styles.sourceTop}>
              <Badge label="PHIVOLCS" tone="dark" />
              <Badge
                label={bulletin.alertLevel ? `Alert Level ${bulletin.alertLevel}` : "Level unknown"}
                tone="warning"
              />
            </View>
            <Text style={styles.heroTitle}>{bulletin.title}</Text>
            <Text style={styles.heroText}>{formatPublishedAt(bulletin.publishedAt)}</Text>
            <Text style={styles.heroText}>Scraped {formatPublishedAt(bulletin.scrapedAt)}</Text>
            <PrimaryButton
              label="Open source"
              icon={ExternalLink}
              onPress={() => void Linking.openURL(bulletin.sourceUrl)}
              tone="light"
            />
          </Card>

          <Card tone={explanation?.fallback ? "warning" : "info"}>
            <SectionHeading
              title="AI explainer"
              action={
                <Badge
                  label={
                    explanation?.fallback
                      ? "Fallback"
                      : explanation
                        ? "Gemini"
                        : explanationQuery.isFetching
                          ? "Loading"
                          : "Ready"
                  }
                  tone={
                    explanation?.fallback
                      ? "warning"
                      : explanationQuery.isFetching
                        ? "warning"
                        : "success"
                  }
                />
              }
            />
            {explanationQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Preparing the AI explanation...</Text>
              </View>
            ) : null}
            {explanationQuery.isError && !explanation ? (
              <>
                <Text style={styles.errorText}>{getErrorMessage(explanationQuery.error)}</Text>
                <PrimaryButton label="Try again" icon={RefreshCw} onPress={refresh} />
              </>
            ) : null}
            {explanation ? (
              <>
                {explanation.fallback ? (
                  <View style={styles.fallbackBox}>
                    <AlertTriangle color="#6F4A00" size={17} strokeWidth={2.4} />
                    <Text style={styles.fallbackText}>
                      Gemini is unavailable, so VOLT is showing a rule-based explanation.
                    </Text>
                  </View>
                ) : null}
                <Text style={styles.modelText}>Model: {explanation.model}</Text>
                <ExplanationSection title="What happened" items={explanation.whatHappened} />
                <ExplanationSection title="What it means" items={explanation.whatItMeans} />
                <ExplanationSection title="What to avoid" items={explanation.whatToAvoid} />
                <ExplanationSection title="What to prepare" items={explanation.whatToPrepare} />
                <ExplanationSection title="High-risk people" items={explanation.highRiskPeople} />
                <InfoRow label="Uncertainty" value={explanation.uncertainty} />
                <InfoRow label="Source URL" value={explanation.sourceUrl} />
                <InfoRow label="Generated" value={formatPublishedAt(explanation.generatedAt)} />
                <View style={styles.safetyRow}>
                  <ShieldAlert color={colors.primary} size={17} strokeWidth={2.4} />
                  <Text style={styles.safetyText}>{explanation.safetyNote}</Text>
                </View>
              </>
            ) : null}
          </Card>

          <Card tone="surface">
            <SectionHeading
              title="Official details"
              action={<Badge label={isRefreshing ? "Refreshing" : `BID ${bulletin.id}`} tone="info" />}
            />
            <InfoRow label="Detected date" value={bulletin.publishedAt ?? "Not detected"} />
            <InfoRow label="Source URL" value={bulletin.sourceUrl} />
            <View style={styles.rawBox}>
              <Radio color={colors.primary} size={17} strokeWidth={2.4} />
              <Text style={styles.rawText}>{truncateText(bulletin.rawText)}</Text>
            </View>
            <PrimaryButton
              label={isRefreshing ? "Refreshing" : "Refresh"}
              icon={RefreshCw}
              onPress={refresh}
            />
          </Card>
        </>
      ) : null}
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ExplanationSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.explanationSection}>
      <Text style={styles.explanationTitle}>{title}</Text>
      {items.map((item) => (
        <View style={styles.item} key={`${title}-${item}`}>
          <View style={styles.dot} />
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function normalizeExplanation(
  explanation: TaalBulletinExplanation | undefined,
  bulletin: TaalBulletin | undefined
) {
  if (!explanation) {
    return undefined;
  }

  const legacySummary = toStringList(
    (explanation as TaalBulletinExplanation & { plainLanguageSummary?: unknown })
      .plainLanguageSummary
  );

  return {
    id: explanation.id ?? bulletin?.id,
    sourceUrl: explanation.sourceUrl ?? bulletin?.sourceUrl ?? "",
    model: explanation.model ?? (legacySummary.length > 0 ? "backend explainer" : "unknown"),
    whatHappened: toStringList(explanation.whatHappened, legacySummary),
    whatItMeans: toStringList(explanation.whatItMeans, [
      "Treat this as a source-grounded readiness summary, not a forecast."
    ]),
    whatToAvoid: toStringList(explanation.whatToAvoid, [
      "Avoid acting on rumors or unofficial volcano updates."
    ]),
    whatToPrepare: toStringList(explanation.whatToPrepare, [
      "Keep monitoring PHIVOLCS and local government instructions."
    ]),
    highRiskPeople: toStringList(explanation.highRiskPeople, [
      "People who need help moving, children, elderly people, and those sensitive to ash or gas may need extra support."
    ]),
    uncertainty:
      explanation.uncertainty ??
      "This explanation is based only on the official bulletin text provided.",
    safetyNote:
      explanation.safetyNote ??
      "Always follow official PHIVOLCS advisories and local government instructions.",
    generatedAt: explanation.generatedAt,
    fallback: explanation.fallback ?? legacySummary.length > 0,
    fallbackReason: explanation.fallbackReason
  };
}

function toStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
}

function formatPublishedAt(value?: string) {
  if (!value) {
    return "Date not detected";
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined
  }).format(new Date(parsed));
}

function truncateText(value: string) {
  return value.length > 900 ? `${value.slice(0, 900).trim()}...` : value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unknown bulletin error occurred.";
}

const styles = StyleSheet.create({
  sourceTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroTitle: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 23
  },
  heroText: {
    color: "#D8EFF2",
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
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
    fontWeight: "700",
    lineHeight: 16
  },
  errorTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  errorTitle: {
    color: colors.critical,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 14,
    fontWeight: "800"
  },
  errorText: {
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  configText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15
  },
  fallbackBox: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: colors.warning,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  fallbackText: {
    color: "#6F4A00",
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  modelText: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15
  },
  explanationSection: {
    gap: 6
  },
  explanationTitle: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
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
  safetyRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  safetyText: {
    color: colors.primaryDark,
    flex: 1,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  infoRow: {
    gap: 3
  },
  infoLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  infoValue: {
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  rawBox: {
    backgroundColor: colors.chip,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 10
  },
  rawText: {
    color: colors.ink,
    flex: 1,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 15
  }
});

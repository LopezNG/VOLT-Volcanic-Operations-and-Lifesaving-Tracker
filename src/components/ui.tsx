import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { colors, font, radii, shadow } from "../constants/theme";

export function Card({
  children,
  tone = "surface",
  padded = true
}: {
  children: ReactNode;
  tone?: "surface" | "dark" | "warning" | "critical" | "info" | "success" | "chip";
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, styles[tone], padded && styles.cardPadding]}>
      {children}
    </View>
  );
}

export function TextBlock({
  title,
  body,
  inverted = false
}: {
  title: string;
  body?: string;
  inverted?: boolean;
}) {
  return (
    <View style={styles.textBlock}>
      <Text style={[styles.cardTitle, inverted && styles.invertedText]}>{title}</Text>
      {body ? <Text style={[styles.body, inverted && styles.invertedMuted]}>{body}</Text> : null}
    </View>
  );
}

export function Badge({
  label,
  tone = "info"
}: {
  label: string;
  tone?: "info" | "warning" | "critical" | "success" | "dark";
}) {
  return (
    <View style={[styles.badge, getBadgeStyle(tone)]}>
      <Text style={[styles.badgeText, tone === "dark" && styles.darkBadgeText]}>{label}</Text>
    </View>
  );
}

export function IconBadge({
  icon: Icon,
  tone = "info"
}: {
  icon: LucideIcon;
  tone?: "info" | "warning" | "critical" | "success" | "dark";
}) {
  const colorMap = {
    info: colors.primary,
    warning: "#6F4A00",
    critical: colors.critical,
    success: colors.success,
    dark: colors.surface
  };

  return (
    <View style={[styles.iconBadge, getBadgeStyle(tone)]}>
      <Icon color={colorMap[tone]} size={17} strokeWidth={2.3} />
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

export function ActionRow({
  icon: Icon,
  title,
  detail,
  checked,
  tone = "surface",
  onPress
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  checked?: boolean;
  tone?: "surface" | "warning" | "critical" | "info" | "success";
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.actionRow, getRowStyle(tone)]}>
      <IconBadge icon={Icon} tone={checked ? "success" : tone === "surface" ? "info" : tone} />
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        {detail ? <Text style={styles.smallMuted}>{detail}</Text> : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function PrimaryButton({
  label,
  icon: Icon,
  onPress,
  tone = "primary"
}: {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  tone?: "primary" | "light" | "danger";
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "primary" && styles.primaryButton,
        tone === "light" && styles.lightButton,
        tone === "danger" && styles.dangerButton,
        pressed && styles.pressed
      ]}
    >
      {Icon ? (
        <Icon
          color={tone === "light" ? colors.primary : colors.surface}
          size={17}
          strokeWidth={2.4}
        />
      ) : null}
      <Text style={[styles.buttonText, tone === "light" && styles.lightButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeading({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

function getBadgeStyle(tone: "info" | "warning" | "critical" | "success" | "dark"): StyleProp<ViewStyle> {
  switch (tone) {
    case "warning":
      return styles.warningBadge;
    case "critical":
      return styles.criticalBadge;
    case "success":
      return styles.successBadge;
    case "dark":
      return styles.darkBadge;
    case "info":
    default:
      return styles.infoBadge;
  }
}

function getRowStyle(tone: "surface" | "warning" | "critical" | "info" | "success"): StyleProp<ViewStyle> {
  switch (tone) {
    case "warning":
      return styles.warningRow;
    case "critical":
      return styles.criticalRow;
    case "info":
      return styles.infoRow;
    case "success":
      return styles.successRow;
    case "surface":
    default:
      return styles.surfaceRow;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.subtle,
    gap: 8
  },
  cardPadding: {
    padding: 12
  },
  surface: {
    backgroundColor: colors.surface,
    ...shadow
  },
  dark: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
    ...shadow
  },
  warning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning
  },
  critical: {
    backgroundColor: colors.criticalBg,
    borderColor: "#FDA29B"
  },
  info: {
    backgroundColor: colors.infoBg,
    borderColor: "#CFE6EA"
  },
  success: {
    backgroundColor: colors.successBg,
    borderColor: "#BAE7C8"
  },
  chip: {
    backgroundColor: colors.chip,
    borderColor: colors.chip
  },
  textBlock: {
    gap: 4
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19
  },
  body: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 16
  },
  invertedText: {
    color: colors.surface
  },
  invertedMuted: {
    color: "#D8EFF2"
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  badgeText: {
    color: colors.primaryDark,
    fontFamily: font.medium,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  darkBadgeText: {
    color: colors.surface
  },
  infoBadge: {
    backgroundColor: colors.infoBg
  },
  warningBadge: {
    backgroundColor: colors.warningBg
  },
  criticalBadge: {
    backgroundColor: colors.criticalBg
  },
  successBadge: {
    backgroundColor: colors.successBg
  },
  darkBadge: {
    backgroundColor: "rgba(255,255,255,0.14)"
  },
  iconBadge: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  progressTrack: {
    backgroundColor: colors.subtle,
    borderRadius: radii.sm,
    height: 9,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    height: "100%"
  },
  actionRow: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  surfaceRow: {
    backgroundColor: colors.surface,
    borderColor: colors.subtle
  },
  warningRow: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning
  },
  criticalRow: {
    backgroundColor: colors.criticalBg,
    borderColor: "#FDA29B"
  },
  infoRow: {
    backgroundColor: colors.infoBg,
    borderColor: "#CFE6EA"
  },
  successRow: {
    backgroundColor: colors.successBg,
    borderColor: "#BAE7C8"
  },
  actionCopy: {
    flex: 1,
    gap: 2
  },
  actionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  smallMuted: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 14
  },
  button: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: 8,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  lightButton: {
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderWidth: 1
  },
  dangerButton: {
    backgroundColor: colors.critical
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }]
  },
  buttonText: {
    color: colors.surface,
    fontFamily: font.medium,
    fontSize: 14,
    fontWeight: "800"
  },
  lightButtonText: {
    color: colors.primary
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  }
});

import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bot,
  ClipboardList,
  Home,
  IdCard,
  ShieldAlert,
  UserRound
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { colors, font, radii, shadow } from "../constants/theme";

interface AppShellProps {
  children: ReactNode;
  scroll?: boolean;
}

const mainTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/household", label: "Profile", icon: UserRound },
  { href: "/bulletin", label: "AI", icon: Bot },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/offline-card", label: "Card", icon: IdCard }
];

export function AppShell({ children, scroll = true }: AppShellProps) {
  const insets = useSafeAreaInsets();
  const contentPaddingBottom = Math.max(insets.bottom, 16) + 98;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { paddingBottom: contentPaddingBottom }]}>{children}</View>
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  rightIcon: RightIcon = ShieldAlert,
  onRightPress
}: {
  title: string;
  subtitle: string;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onRightPress}
        style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.7 }]}
      >
        <RightIcon color={colors.primary} size={19} strokeWidth={2.3} />
      </Pressable>
    </View>
  );
}

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navWrap, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.navPill}>
        {mainTabs.map((tab) => {
          const isActive =
            pathname === tab.href || (pathname === "/" && tab.href === "/dashboard");
          const Icon = tab.icon;

          return (
            <Pressable
              key={tab.href}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => router.push(tab.href)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.activeNavItem,
                pressed && { opacity: 0.78 }
              ]}
            >
              <Icon color={isActive ? colors.surface : colors.muted} size={16} strokeWidth={2.4} />
              <Text style={[styles.navLabel, isActive && styles.activeNavLabel]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.bg,
    flex: 1
  },
  content: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 27
  },
  subtitle: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  navWrap: {
    backgroundColor: colors.bg,
    bottom: 0,
    left: 0,
    paddingHorizontal: 21,
    paddingTop: 12,
    position: "absolute",
    right: 0
  },
  navPill: {
    backgroundColor: colors.surface,
    borderColor: colors.subtle,
    borderRadius: 36,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    height: 62,
    padding: 4,
    ...shadow
  },
  navItem: {
    alignItems: "center",
    borderRadius: 26,
    flex: 1,
    gap: 3,
    justifyContent: "center",
    minWidth: 0
  },
  activeNavItem: {
    backgroundColor: colors.primary
  },
  navLabel: {
    color: colors.muted,
    fontFamily: font.medium,
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 11,
    textTransform: "uppercase"
  },
  activeNavLabel: {
    color: colors.surface
  }
});

import { Platform } from "react-native";

export const colors = {
  bg: "#F7FAF9",
  chip: "#EEF4F3",
  critical: "#D92D20",
  criticalBg: "#FEE4E2",
  infoBg: "#E8F4F6",
  ink: "#102124",
  muted: "#5D6B70",
  primary: "#0B4F5A",
  primaryDark: "#073B44",
  shadow: "rgba(11, 37, 48, 0.08)",
  subtle: "#E4EBEA",
  success: "#188A55",
  successBg: "#DCFCE7",
  surface: "#FFFFFF",
  warning: "#F2A900",
  warningBg: "#FFF5D6"
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999
};

export const font = {
  regular: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  medium: Platform.select({ ios: "System", android: "sans-serif-medium", default: "System" }),
  bold: Platform.select({ ios: "System", android: "sans-serif-condensed", default: "System" })
};

export const shadow = {
  shadowColor: "#0B2530",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 18,
  elevation: 3
};

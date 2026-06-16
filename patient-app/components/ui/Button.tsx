import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import COLORS from "../../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "accent" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  isLoading?: boolean;
  style?: any;
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = (): any => {
    const base: ViewStyle = styles.button;
    let type: ViewStyle = {};
    let sizeStyle: ViewStyle = {};

    switch (variant) {
      case "primary":
        type = {
          backgroundColor: COLORS.primary,
          ...Platform.select({
            ios: {
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
            web: {
              boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)",
            },
          }),
        };
        break;
      case "secondary":
        type = { backgroundColor: COLORS.primaryLight };
        break;
      case "accent":
        type = {
          backgroundColor: COLORS.accent,
          ...Platform.select({
            ios: {
              shadowColor: COLORS.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
            web: {
              boxShadow: "0 4px 12px rgba(249, 115, 22, 0.15)",
            },
          }),
        };
        break;
      case "danger":
        type = {
          backgroundColor: COLORS.danger,
          ...Platform.select({
            ios: {
              shadowColor: COLORS.danger,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
            web: {
              boxShadow: "0 4px 12px rgba(244, 63, 94, 0.15)",
            },
          }),
        };
        break;
      case "outline":
        type = {
          backgroundColor: COLORS.transparent,
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        };
        break;
    }

    switch (size) {
      case "sm":
        sizeStyle = { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 };
        break;
      case "md":
        sizeStyle = { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 };
        break;
      case "lg":
        sizeStyle = { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16 };
        break;
    }

    if (disabled) {
      type = {
        ...type,
        backgroundColor: variant === "outline" ? COLORS.transparent : COLORS.border,
        borderColor: variant === "outline" ? COLORS.border : undefined,
        shadowOpacity: 0,
        ...Platform.select({
          web: {
            boxShadow: "none",
          },
        }),
      };
    }

    const flattenedStyle = StyleSheet.flatten(style);
    return { ...base, ...type, ...sizeStyle, ...flattenedStyle };
  };

  const getTextStyles = (): any => {
    let typeText: TextStyle = { color: COLORS.white };

    switch (variant) {
      case "secondary":
        typeText = { color: COLORS.primary };
        break;
      case "outline":
        typeText = { color: COLORS.primary };
        break;
      case "primary":
      case "accent":
      case "danger":
        typeText = { color: COLORS.white };
        break;
    }

    if (disabled) {
      typeText = { color: COLORS.textSecondary };
    }

    const sizeText: TextStyle =
      size === "sm" ? { fontSize: 13, fontWeight: "600" } : { fontSize: 15, fontWeight: "700" };

    const flattenedTextStyle = StyleSheet.flatten(textStyle);
    return { ...typeText, ...sizeText, ...flattenedTextStyle };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={getButtonStyles()}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "secondary" || variant === "outline" ? COLORS.primary : COLORS.white
          }
        />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

export default Button;

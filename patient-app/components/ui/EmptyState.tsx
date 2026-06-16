import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import * as Icons from "lucide-react-native";
import COLORS from "../../constants/colors";
import Button from "./Button";

interface EmptyStateProps {
  iconName: keyof typeof Icons;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName,
  title,
  description,
  actionLabel,
  onActionPress,
  style,
}) => {
  // Dynamically resolve lucide icon
  const IconComponent = (Icons[iconName] as any) || Icons.FolderOpen;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <IconComponent size={32} color={COLORS.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onActionPress && (
        <Button
          title={actionLabel}
          onPress={onActionPress}
          variant="secondary"
          size="sm"
          style={styles.btn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  btn: {
    width: "auto",
    paddingHorizontal: 20,
  },
});

export default EmptyState;

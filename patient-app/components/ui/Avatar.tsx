import React from "react";
import { View, Text, Image, StyleSheet, ViewStyle } from "react-native";
import COLORS from "../../constants/colors";
import { getInitials } from "../../utils/format.utils";

interface AvatarProps {
  firstName: string;
  lastName: string;
  imageUrl?: string;
  size?: number;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  firstName,
  lastName,
  imageUrl,
  size = 48,
  style,
}) => {
  const initials = getInitials(firstName, lastName);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  text: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});

export default Avatar;

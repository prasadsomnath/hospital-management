import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar } from "lucide-react-native";
import COLORS from "../../constants/colors";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    degree: string;
    specialization: string;
    availableDays: string[];
    nextAvailableSlot: string;
    avatarUrl?: string;
  };
  onBookPress: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookPress }) => {
  // Extract initials
  const nameParts = doctor.name.replace("Dr. ", "").split(" ");
  const first = nameParts[0] || "D";
  const last = nameParts[1] || "R";

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar firstName={first} lastName={last} imageUrl={doctor.avatarUrl} size={50} style={styles.avatar} />
        <View style={styles.meta}>
          <Text style={styles.name}>{doctor.name}</Text>
          <Text style={styles.degree}>{doctor.degree}</Text>
          <Text style={styles.spec}>{doctor.specialization}</Text>
        </View>
      </View>

      <View style={styles.daysContainer}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
          const isAvailable = doctor.availableDays.includes(day);
          return (
            <View
              key={day}
              style={[
                styles.dayChip,
                isAvailable ? styles.dayChipActive : styles.dayChipInactive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isAvailable ? styles.dayTextActive : styles.dayTextInactive,
                ]}
              >
                {day}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.slotWrap}>
          <Calendar size={14} color={COLORS.primary} style={styles.slotIcon} />
          <Text numberOfLines={1} style={styles.slotText}>{doctor.nextAvailableSlot}</Text>
        </View>
        <Button
          title="Book Slot"
          onPress={onBookPress}
          size="sm"
          style={styles.bookBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 14,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  degree: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  spec: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },
  daysContainer: {
    flexDirection: "row",
    marginVertical: 14,
  },
  dayChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
  },
  dayChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: "rgba(26, 111, 232, 0.15)",
  },
  dayChipInactive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  dayText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dayTextActive: {
    color: COLORS.primary,
  },
  dayTextInactive: {
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 12,
  },
  slotWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  slotIcon: {
    marginRight: 6,
  },
  slotText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  bookBtn: {
    width: "auto",
    paddingHorizontal: 16,
  },
});

export default DoctorCard;

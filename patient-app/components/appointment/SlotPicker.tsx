import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import COLORS from "../../constants/colors";

interface Slot {
  time: string;
  isBooked: boolean;
  period: "Morning" | "Afternoon";
}

interface SlotPickerProps {
  slots: Slot[];
  selectedSlot?: string;
  onSlotSelect: (time: string) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlot,
  onSlotSelect,
}) => {
  const morningSlots = slots.filter((s) => s.period === "Morning");
  const afternoonSlots = slots.filter((s) => s.period === "Afternoon");

  const renderSlotGrid = (filteredSlots: Slot[], header: string) => {
    if (filteredSlots.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{header}</Text>
        <View style={styles.grid}>
          {filteredSlots.map((slot) => {
            const isSelected = selectedSlot === slot.time;
            
            return (
              <TouchableOpacity
                key={slot.time}
                disabled={slot.isBooked}
                activeOpacity={0.8}
                onPress={() => onSlotSelect(slot.time)}
                style={[
                  styles.slotChip,
                  slot.isBooked && styles.slotBooked,
                  isSelected && styles.slotSelected,
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    slot.isBooked && styles.textBooked,
                    isSelected && styles.textSelected,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderSlotGrid(morningSlots, "Morning slots (9:00 AM – 12:00 PM)")}
      {renderSlotGrid(afternoonSlots, "Afternoon slots (2:00 PM – 5:00 PM)")}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  slotChip: {
    width: "30.5%",
    marginHorizontal: "1.4%",
    marginBottom: 10,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  slotBooked: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.background,
  },
  slotSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  slotText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  textBooked: {
    color: COLORS.border,
    textDecorationLine: "line-through",
  },
  textSelected: {
    color: COLORS.primary,
  },
});

export default SlotPicker;

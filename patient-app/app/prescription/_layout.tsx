import { Stack } from "expo-router";

export default function PrescriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F4F6FA" },
      }}
    />
  );
}

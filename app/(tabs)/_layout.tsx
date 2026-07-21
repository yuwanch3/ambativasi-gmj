import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // BARIS UTAMA: Ini untuk menghilangkan navigasi hitam di bagian bawah layar
        tabBarStyle: { display: "none" },
      }}
    />
  );
}

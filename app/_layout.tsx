import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

// --- IMPORT TEMA GLOBAL & CONTEXT ---
import { ThemeProvider as CustomThemeProvider, useTheme } from "../context/ThemeContext";

// --- TAMBAHAN KODE TOAST DIMULAI DI SINI ---
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

// --- IMPORT UNTUK NAVIGASI BAR SYSTEM ---
import React, { useEffect } from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

// Konfigurasi custom agar toast muncul dari atas, agak kecil, dan sudutnya membulat
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#22c55e",
        borderRadius: 15,
        height: "auto",
        minHeight: 55,
        width: "85%",
        marginTop: 10,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 14, fontWeight: "bold" }}
      text2Style={{ fontSize: 12, color: "#666" }}
      text2NumberOfLines={0}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#ef4444",
        borderRadius: 15,
        height: "auto",
        minHeight: 55,
        width: "85%",
        marginTop: 10,
        paddingVertical: 10,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 14, fontWeight: "bold" }}
      text2Style={{ fontSize: 12, color: "#666" }}
      text2NumberOfLines={0}
    />
  ),
};
// --- TAMBAHAN KODE TOAST SELESAI DI SINI ---

// 💡 KOMPONEN KONTEN NAVIGASI YANG TERHUBUNG DENGAN TEMA REAL-TIME
function RootLayoutNav() {
  const { colors } = useTheme();

  // 👇 LOGIKA GLOBAL NAVIGATION BAR ANDROID 👇
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");

      let timeoutId: any;

      const subscription = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === "visible") {
          if (timeoutId) clearTimeout(timeoutId);

          timeoutId = setTimeout(() => {
            NavigationBar.setVisibilityAsync("hidden");
          }, 3000);
        }
      });

      return () => {
        subscription.remove();
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, []);
  // 👆 SELESAI LOGIKA NAVIGATION BAR 👆

  return (
    <NavigationThemeProvider value={colors.isDark ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="auth/login">
        {/* Halaman Auth */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{ headerShown: false }}
        />

        {/* Core Tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="profile" options={{ headerShown: false }} />

        <Stack.Screen name="pengaturan" options={{ headerShown: false }} />

        {/* Halaman Ujian */}
        <Stack.Screen name="ujian/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="ujian/bahasa-jepang-ujian/subUjian-Nihongo"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ujian/bahasa-jepang-ujian/N5-ujian/nihongo-N5-ujian"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ujian/tajwid-islam-ujian/tajwid-ujian"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ujian/tajwid-islam-ujian/al-fatihah/ujian-alfatihah"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ujian/tajwid-islam-ujian/al-fatihah/review-Jawaban-ujian"
          options={{ headerShown: false }}
        />

        {/* Halaman Materi */}
        <Stack.Screen name="materi/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="materi/bahasa-jepang/nihongo"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="materi/bahasa-jepang/N5/nihongo-N5"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="materi/bahasa-jepang/N5/bab1/materiBab1"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="materi/tajwid-islam/tajwid"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="materi/tajwid-islam/al-fatihah/materiAl-fatihah"
          options={{ headerShown: false }}
        />

        {/* Modal */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar style={colors.isDark ? "light" : "dark"} />

      {/* Meletakkan komponen Toast di tingkat paling luar */}
      <Toast config={toastConfig} />
    </NavigationThemeProvider>
  );
}

// 💡 ROOT LAYOUT UTAMA DENGAN WRAPPER ThemeProvider GLOBAL
export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <RootLayoutNav />
    </CustomThemeProvider>
  );
}
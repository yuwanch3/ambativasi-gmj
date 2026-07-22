import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 💡 IMPORT KOMPONEN MODULAR NAVBAR & SIDEBAR
import { Navbar } from "../../../components/navbar";
import { Sidebar } from "../../../components/sidebar";

// 💡 IMPORT CONTEXT TEMA & BAHASA GLOBAL REAL-TIME
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";

const { width } = Dimensions.get("window");
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

export default function SoalScreen() {
  // --- TEMA & BAHASA GLOBAL REAL-TIME ---
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [localUserData, setLocalUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../auth/login");
      } else {
        const parsedSession = JSON.parse(session);
        setLocalUserData({
          username: parsedSession.username || "User",
          email: parsedSession.email || "",
        });

        // 💡 AMBIL FOTO PROFIL: Sinkronisasi instan dari database API PHP
        try {
          const responseProfile = await fetch(`${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`);
          const dataProfile = await responseProfile.json();
          if (dataProfile.status === "success" && dataProfile.profile_image) {
            setProfileImage(`${API_URL}/ambativasi-api/${dataProfile.profile_image}`);
          } else {
            setProfileImage(null);
          }
        } catch (e) {
          console.log("Avatar gagal dimuat di Soal screen kawan", e);
        }

        setLoading(false);
      }
    } catch (error) {
      console.log("Gagal memuat session", error);
      router.replace("../auth/login");
    }
  };

  const toggleSidebar = (open: boolean) => {
    if (open) {
      setIsSidebarOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setIsSidebarOpen(false));
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userSession");
      router.replace("../auth/login");
    } catch (error) {
      console.log("Gagal menghapus session", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Array Level untuk mempermudah render berjajar ke bawah
  const levels = [
    {
      id: 1,
      judul: "N5",
      sub: language === "id" ? "Ujian Soal N5" : "N5 Exam Questions",
      path: "/ujian/bahasa-jepang-ujian/N5-ujian/nihongo-N5-ujian",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.card} />

      {/* ==================== NAVBAR ATAS ==================== */}
      <Navbar
        onOpenSidebar={() => toggleSidebar(true)}
        userData={localUserData}
        profileImage={profileImage}
      />

      {/* ==================== KONTEN UTAMA ==================== */}
      <View style={styles.mainContent}>
        {/* TOMBOL KEMBALI */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.isDark ? "#60A5FA" : "#2563EB"} />
          <Text style={[styles.backButtonText, { color: colors.isDark ? "#60A5FA" : "#2563EB" }]}>
            {language === "id" ? "Kembali ke Materi" : "Back to Material"}
          </Text>
        </TouchableOpacity>

        {/* DAFTAR LEVEL BERJAJAR */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === "id" ? "Pilih Tingkatan Ujian" : "Select Exam Level"}
          </Text>

          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(level.path as any)}
            >
              <View style={styles.levelCardLeft}>
                <View
                  style={[
                    styles.levelBadge,
                    {
                      backgroundColor: colors.isDark ? "#1E3A8A" : "#EFF6FF",
                      borderColor: colors.isDark ? "#2563EB" : "#BFDBFE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.levelBadgeText,
                      { color: colors.isDark ? "#93C5FD" : "#2563EB" },
                    ]}
                  >
                    {level.id}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelTitle, { color: colors.text }]}>{level.judul}</Text>
                  <Text
                    style={[styles.levelSubtitle, { color: colors.subtext }]}
                    numberOfLines={1}
                  >
                    {level.sub}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ==================== SIDEBAR / DRAWER MENU ==================== */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar(false)}
        slideAnim={slideAnim}
        userData={localUserData}
        profileImage={profileImage}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  levelCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  levelSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
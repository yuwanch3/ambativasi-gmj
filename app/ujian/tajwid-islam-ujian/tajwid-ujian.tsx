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

const { width } = Dimensions.get("window");
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

export default function MateriScreen() {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../../../auth/login");
      } else {
        const parsedSession = JSON.parse(session);
        setUserData({
          username: parsedSession.username || "User",
          email: parsedSession.email || "",
        });

        // 💡 AMBIL FOTO PROFIL: Sinkronisasi instan dari database API PHP
        try {
          const responseProfile = await fetch(`${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`);
          const dataProfile = await responseProfile.json();
          if (dataProfile.status === "success" && dataProfile.profile_image) {
            setProfileImage(`${API_URL}/ambativasi-api/${dataProfile.profile_image}`);
          }
        } catch (e) {
          console.log("Avatar gagal dimuat di materi screen", e);
        }

        setLoading(false);
      }
    } catch (error) {
      console.log("Gagal memuat session", error);
      router.replace("../../../auth/login");
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
      router.replace("../../../auth/login");
    } catch (error) {
      console.log("Gagal menghapus session", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const levels = [
    {
      id: 1,
      judul: "Al- Fatihah",
      sub: "Ujian Materi Tajwid Al-Fatihah",
      path: "/ujian/tajwid-islam-ujian/al-fatihah/ujian-alfatihah",
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* ==================== NAVBAR ATAS ==================== */}
      <Navbar
        onOpenSidebar={() => toggleSidebar(true)}
        userData={userData}
        profileImage={profileImage}
      />

      {/* ==================== KONTEN UTAMA ==================== */}
      <View style={styles.mainContent}>
        {/* TOMBOL KEMBALI */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#2563EB" />
          <Text style={styles.backButtonText}>Kembali ke Tingkatan</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          <Text style={styles.sectionTitle}>Pilih BAB</Text>

          {levels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={styles.levelCard}
              onPress={() => router.push(level.path as any)}
            >
              <View style={styles.levelCardLeft}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{level.id}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelTitle}>{level.judul}</Text>
                  <Text style={styles.levelSubtitle} numberOfLines={1}>
                    {level.sub}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ==================== SIDEBAR ==================== */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar(false)}
        slideAnim={slideAnim}
        userData={userData}
        profileImage={profileImage}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 6,
  },
  scrollContainer: { flex: 1, marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
  },
  levelCard: {
    backgroundColor: "#FFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    shadowColor: "#0f172A",
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
    backgroundColor: "#EFF6FF",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  levelBadgeText: { fontSize: 16, fontWeight: "bold", color: "#2563EB" },
  levelTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  levelSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
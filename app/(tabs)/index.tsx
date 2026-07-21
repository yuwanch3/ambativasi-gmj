import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 💡 IMPORT KOMPONEN MODULAR NAVBAR & SIDEBAR
import { Navbar } from "../../components/navbar";
import { Sidebar } from "../../components/sidebar";

// 💡 IMPORT CONTEXT TEMA GLOBAL REAL-TIME
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

// 💡 ONLINE: Pastikan alamat Ngrok ini selalu sama dengan terowongan aktifmu ya kawan!
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

export default function HomeScreen() {
  // --- TEMA GLOBAL REAL-TIME ---
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));

  // 💡 STATE BARU: Untuk menyimpan alamat foto profil online dari MySQL
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [userData, setUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);

  // 💡 JALUR UTAMA SINKRONISASI: Jalankan checkSession otomatis tiap user kembali ke page ini
  useFocusEffect(
    React.useCallback(() => {
      checkSession();
    }, [])
  );

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../auth/login");
      } else {
        const parsedSession = JSON.parse(session);
        setUserData({
          username: parsedSession.username || "User",
          email: parsedSession.email || "",
        });

        // 💡 ONLINE: Ambil data path gambar terbaru dari database MySQL kamu kawan!
        const response = await fetch(
          `${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`
        );
        const data = await response.json();

        if (data.status === "success" && data.profile_image) {
          setProfileImage(`${API_URL}/ambativasi-api/${data.profile_image}`);
        } else {
          setProfileImage(null); // Balik ke huruf inisial kalau kosong
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.card} />

      {/* ==================== NAVBAR ATAS ==================== */}
      <Navbar
        onOpenSidebar={() => toggleSidebar(true)}
        userData={userData}
        profileImage={profileImage}
      />

      {/* ==================== KONTEN UTAMA ==================== */}
      <View style={styles.mainContent}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Selamat Datang, {userData?.username}! 👋
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>{userData?.email}</Text>
        </View>

        {/* GRID DUA KOLOM: MATERI & SOAL */}
        <View style={styles.menuGridContainer}>
          {/* CARD MATERI */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/materi")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.isDark ? "#14532D" : "#F0FDF4" },
              ]}
            >
              <Image
                source={require("../../assets/images/icon-materi.png")}
                style={styles.gridCardImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.menuCardTitle, { color: colors.text }]}>Materi</Text>
            <Text style={[styles.menuCardSubtitle, { color: colors.subtext }]}>
              Pelajari rangkuman materi
            </Text>
          </TouchableOpacity>

          {/* CARD SOAL */}
          <TouchableOpacity
            style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/ujian")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.isDark ? "#1E3A8A" : "#EFF6FF" },
              ]}
            >
              <Image
                source={require("../../assets/images/icon-exam.png")}
                style={styles.gridCardImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.menuCardTitle, { color: colors.text }]}>Ujian</Text>
            <Text style={[styles.menuCardSubtitle, { color: colors.subtext }]}>Mulai Ujian</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================== SIDEBAR / DRAWER MENU ==================== */}
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
    padding: 20,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  menuGridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  menuCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    alignItems: "flex-start",
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 16,
    marginBottom: 10,
    width: 85,
    height: 85,
    justifyContent: "center",
    alignItems: "center",
  },
  gridCardImage: {
    width: 67,
    height: 67,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuCardSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
});
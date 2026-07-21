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
import { Navbar } from "../../../../components/navbar";
import { Sidebar } from "../../../../components/sidebar";

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

  // --- DROPDOWN ANIMASI ---
  const [isMateriOpen, setIsMateriOpen] = useState(false);
  const [dropdownAnim] = useState(new Animated.Value(0)); 

  // --- SUB-DROPDOWN UNTUK PILIHAN BAHASA ---
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langAnim] = useState(new Animated.Value(0)); 

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../../../../auth/login");
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
          console.log("Avatar gagal dimuat di materi tajwid screen", e);
        }

        setLoading(false);
      }
    } catch (error) {
      console.log("Gagal memuat session", error);
      router.replace("../../../../auth/login");
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

  const toggleMateriDropdown = () => {
    const toValue = isMateriOpen ? 0 : 1;
    setIsMateriOpen(!isMateriOpen);

    if (isMateriOpen) {
      setIsLangOpen(false);
      Animated.timing(langAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    Animated.timing(dropdownAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const toggleLangDropdown = () => {
    const toValue = isLangOpen ? 0 : 1;
    setIsLangOpen(!isLangOpen);

    Animated.timing(langAnim, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userSession");
      router.replace("../../../../auth/login");
    } catch (error) {
      console.log("Gagal menghapus session", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  const levels = [
    {
      id: 1,
      judul: "Materi Tajwid Al-fatihah",
      sub: "PDF dan Video",
      path: "",
    },
    {
      id: 2,
      judul: "Latihan Soal",
      sub: "Tajwid Al-fatihah",
      path: "",
    },
  ];

  const arrowRotation = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const langArrowRotation = langAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  const dropdownHeight = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isLangOpen ? 140 : 100],
  });

  const langDropdownHeight = langAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 42],
  });

  const dropdownOpacity = dropdownAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const langDropdownOpacity = langAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

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
          <Ionicons name="arrow-back" size={20} color="#16A34A" />
          <Text style={styles.backButtonText}>Kembali ke BAB</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          <Text style={styles.sectionTitle}>Semangat Belajar</Text>

          {levels.map((level) => {
            if (level.id === 1) {
              return (
                <View key={level.id} style={styles.dropdownGroupContainer}>
                  <TouchableOpacity
                    style={[styles.levelCard, { marginBottom: 0 }]}
                    onPress={toggleMateriDropdown}
                    activeOpacity={0.7}
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
                    <Animated.View
                      style={{ transform: [{ rotate: arrowRotation }] }}
                    >
                      <Ionicons name="chevron-down" size={20} color="#94A3B8" />
                    </Animated.View>
                  </TouchableOpacity>

                  <Animated.View
                    style={[
                      styles.dropdownContent,
                      { height: dropdownHeight, opacity: dropdownOpacity },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.subMenuItem}
                      onPress={toggleLangDropdown}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color="#16A34A"
                        />
                        <Text style={styles.subMenuItemText}>
                          Buka Materi PDF (materi tajwid)
                        </Text>
                      </View>
                      <Animated.View
                        style={{ transform: [{ rotate: langArrowRotation }] }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#64748B"
                        />
                      </Animated.View>
                    </TouchableOpacity>

                    <Animated.View
                      style={[
                        styles.langDropdownContent,
                        {
                          height: langDropdownHeight,
                          opacity: langDropdownOpacity,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.langMenuItem}
                        onPress={() =>
                          router.push(
                            "/materi/tajwid-islam/al-fatihah/pdfsurahAl-fatihah" as any
                          )
                        }
                      >
                        <View style={styles.langDot} />
                        <Text style={styles.langMenuItemText}>surah al-fatihah</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                      style={[styles.subMenuItem, { borderBottomWidth: 0 }]}
                      onPress={() =>
                        router.push("/materi/tajwid-islam/al-fatihah/videosurahAl-fatihah")
                      }
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color="#2563EB"
                      />
                      <Text style={styles.subMenuItemText}>
                        Tonton Video Pembelajaran
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={level.id}
                style={styles.levelCard}
                onPress={() =>
                  router.push({
                    pathname: "/materi/tajwid-islam/al-fatihah/latihanSoal",
                    params: {
                      tipe_sumber: "pdf",
                      sumber_data: "TJ_AL_FATIHAH", 
                      judul_bab: "Kuis Surah Al-Fatihah", 
                    },
                  })
                }
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
            );
          })}
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
    color: "#16A34A",
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
    backgroundColor: "#F0FDF4",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  levelBadgeText: { fontSize: 16, fontWeight: "bold", color: "#16A34A" },
  levelTitle: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  levelSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },

  dropdownGroupContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownContent: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
  },
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  subMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginLeft: 10,
  },

  langDropdownContent: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  langMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  langDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#64748B",
    marginRight: 10,
    marginLeft: 4,
  },
  langMenuItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
  },
});
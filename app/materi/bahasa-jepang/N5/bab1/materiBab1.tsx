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
import { Navbar } from "../../../../../components/navbar";
import { Sidebar } from "../../../../../components/sidebar";

// 💡 IMPORT CONTEXT TEMA GLOBAL REAL-TIME
import { useTheme } from "../../../../../context/ThemeContext";

const { width } = Dimensions.get("window");
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

export default function MateriScreen() {
  // --- TEMA GLOBAL REAL-TIME ---
  const { colors } = useTheme();

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

        // 💡 INTEGRASI: Mengambil data tautan gambar dari database PHP kamu kawan
        try {
          const responseProfile = await fetch(
            `${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`
          );
          const dataProfile = await responseProfile.json();
          if (dataProfile.status === "success" && dataProfile.profile_image) {
            setProfileImage(
              `${API_URL}/ambativasi-api/${dataProfile.profile_image}`
            );
          }
        } catch (e) {
          console.log("Avatar gagal dimuat di materi screen", e);
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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  const levels = [
    {
      id: 1,
      judul: "Materi BAB 1",
      sub: "PDF dan Video",
      path: "",
    },
    {
      id: 2,
      judul: "Latihan Soal",
      sub: "Bab 1",
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
    outputRange: [0, isLangOpen ? 195 : 100],
  });

  const langDropdownHeight = langAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 85],
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.card}
      />

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
          <Ionicons
            name="arrow-back"
            size={20}
            color={colors.isDark ? "#4ADE80" : "#16A34A"}
          />
          <Text
            style={[
              styles.backButtonText,
              { color: colors.isDark ? "#4ADE80" : "#16A34A" },
            ]}
          >
            Kembali ke BAB
          </Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Semangat Belajar
          </Text>

          {levels.map((level) => {
            if (level.id === 1) {
              return (
                <View
                  key={level.id}
                  style={[
                    styles.dropdownGroupContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.levelCard, { marginBottom: 0, backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={toggleMateriDropdown}
                    activeOpacity={0.7}
                  >
                    <View style={styles.levelCardLeft}>
                      <View
                        style={[
                          styles.levelBadge,
                          {
                            backgroundColor: colors.isDark ? "#14532D" : "#F0FDF4",
                            borderColor: colors.isDark ? "#166534" : "#BBF7D0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.levelBadgeText,
                            { color: colors.isDark ? "#4ADE80" : "#16A34A" },
                          ]}
                        >
                          {level.id}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.levelTitle, { color: colors.text }]}
                        >
                          {level.judul}
                        </Text>
                        <Text
                          style={[
                            styles.levelSubtitle,
                            { color: colors.subtext },
                          ]}
                          numberOfLines={1}
                        >
                          {level.sub}
                        </Text>
                      </View>
                    </View>
                    <Animated.View
                      style={{ transform: [{ rotate: arrowRotation }] }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={colors.subtext}
                      />
                    </Animated.View>
                  </TouchableOpacity>

                  <Animated.View
                    style={[
                      styles.dropdownContent,
                      {
                        height: dropdownHeight,
                        opacity: dropdownOpacity,
                        backgroundColor: colors.isDark ? "#0F172A" : "#F8FAFC",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.subMenuItem,
                        { borderColor: colors.border },
                      ]}
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
                        <Text
                          style={[
                            styles.subMenuItemText,
                            { color: colors.text },
                          ]}
                        >
                          Buka Materi PDF (materiBab1)
                        </Text>
                      </View>
                      <Animated.View
                        style={{
                          transform: [{ rotate: langArrowRotation }],
                        }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.subtext}
                        />
                      </Animated.View>
                    </TouchableOpacity>

                    <Animated.View
                      style={[
                        styles.langDropdownContent,
                        {
                          height: langDropdownHeight,
                          opacity: langDropdownOpacity,
                          backgroundColor: colors.isDark ? "#1E293B" : "#F1F5F9",
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.langMenuItem,
                          { borderColor: colors.border },
                        ]}
                        onPress={() =>
                          router.push(
                            "/materi/bahasa-jepang/N5/bab1/pdfBab1-bin" as any
                          )
                        }
                      >
                        <View
                          style={[
                            styles.langDot,
                            { backgroundColor: colors.subtext },
                          ]}
                        />
                        <Text
                          style={[
                            styles.langMenuItemText,
                            { color: colors.text },
                          ]}
                        >
                          B.Indo
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.langMenuItem,
                          { borderBottomWidth: 0 },
                        ]}
                        onPress={() =>
                          router.push(
                            "/materi/bahasa-jepang/N5/bab1/pdfBab1-bjp" as any
                          )
                        }
                      >
                        <View
                          style={[
                            styles.langDot,
                            { backgroundColor: colors.subtext },
                          ]}
                        />
                        <Text
                          style={[
                            styles.langMenuItemText,
                            { color: colors.text },
                          ]}
                        >
                          B.Jepang
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                      style={[styles.subMenuItem, { borderBottomWidth: 0 }]}
                      onPress={() =>
                        router.push("/materi/bahasa-jepang/N5/bab1/videoBab1")
                      }
                    >
                      <Ionicons
                        name="play-circle-outline"
                        size={18}
                        color="#2563EB"
                      />
                      <Text
                        style={[
                          styles.subMenuItemText,
                          { color: colors.text },
                        ]}
                      >
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
                style={[
                  styles.levelCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/materi/bahasa-jepang/N5/bab1/latihanSoal",
                    params: {
                      tipe_sumber: "pdf",
                      sumber_data: "minho-bab-1-ind.pdf",
                      judul_bab: "Latihan Soal - BAB 1",
                    },
                  })
                }
              >
                <View style={styles.levelCardLeft}>
                  <View
                    style={[
                      styles.levelBadge,
                      {
                        backgroundColor: colors.isDark ? "#14532D" : "#F0FDF4",
                        borderColor: colors.isDark ? "#166534" : "#BBF7D0",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.levelBadgeText,
                        { color: colors.isDark ? "#4ADE80" : "#16A34A" },
                      ]}
                    >
                      {level.id}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.levelTitle, { color: colors.text }]}>
                      {level.judul}
                    </Text>
                    <Text
                      style={[styles.levelSubtitle, { color: colors.subtext }]}
                      numberOfLines={1}
                    >
                      {level.sub}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.subtext}
                />
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
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginLeft: 6,
  },
  scrollContainer: { flex: 1, marginTop: 4 },
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
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
  },
  levelBadgeText: { fontSize: 16, fontWeight: "bold" },
  levelTitle: { fontSize: 16, fontWeight: "bold" },
  levelSubtitle: { fontSize: 12, marginTop: 2 },

  dropdownGroupContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  dropdownContent: {
    paddingHorizontal: 16,
  },
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
  },

  langDropdownContent: {
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  langMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  langDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginLeft: 4,
  },
  langMenuItemText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
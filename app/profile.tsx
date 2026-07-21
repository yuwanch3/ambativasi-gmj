import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 💡 IMPORT KOMPONEN MODULAR NAVBAR & SIDEBAR
import { Navbar } from "../components/navbar";
import { Sidebar } from "../components/sidebar";

// 💡 IMPORT CONTEXT TEMA GLOBAL REAL-TIME
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

// 💡 ONLINE: Pastikan alamat Ngrok ini sama persis dengan yang aktif di terminalmu ya kawan!
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

export default function ProfileScreen() {
  // --- TEMA GLOBAL REAL-TIME ---
  const { colors } = useTheme();

  // --- STATE LAYOUT & SIDEBAR ---
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // --- STATE MODAL PREVIEW & CROP FOTO ---
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE USER DATA ---
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);

  // --- PAN RESPONDER UNTUK GESER FOTO DI CROP MODAL ---
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    })
  ).current;

  // Auto-refresh data profil setiap kali user masuk kembali ke halaman ini kawan!
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

        const response = await fetch(
          `${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`
        );
        const data = await response.json();

        if (data.status === "success" && data.profile_image) {
          setProfileImage(`${API_URL}/ambativasi-api/${data.profile_image}`);
        }

        setLoading(false);
      }
    } catch (error) {
      console.log("Gagal memuat session", error);
      router.replace("../auth/login");
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Aplikasi butuh izin akses galeri untuk mengganti foto!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      pan.setValue({ x: 0, y: 0 });
      pan.setOffset({ x: 0, y: 0 });
      setTempImageUri(result.assets[0].uri);
      setIsPreviewModalOpen(true);
    }
  };

  const handleConfirmUpload = async () => {
    if (!tempImageUri || !userData?.email) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("email", userData.email);
    formData.append("image", {
      uri: tempImageUri,
      name: `profile_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    try {
      const uploadResponse = await fetch(
        `${API_URL}/ambativasi-api/upload-profile.php`,
        {
          method: "POST",
          body: formData,
          headers: {},
        }
      );

      const uploadResult = await uploadResponse.json();
      if (uploadResult.status === "success") {
        setProfileImage(`${API_URL}/ambativasi-api/${uploadResult.profile_image}`);
        setIsPreviewModalOpen(false);
        alert("🎉 Foto profil sukses tersimpan di Database MySQL!");
      } else {
        alert("Gagal menyimpan ke server: " + uploadResult.message);
      }
    } catch (error) {
      console.log("Eror saat mengunggah foto ke database", error);
      alert("Terjadi kesalahan jaringan saat mengupload foto.");
    } finally {
      setIsUploading(false);
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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.card}
      />

      {/* ==================== NAVBAR ATAS MODULAR ==================== */}
      <Navbar
        onOpenSidebar={() => toggleSidebar(true)}
        userData={userData}
        profileImage={profileImage}
      />

      {/* ==================== KONTEN UTAMA PROFILE ==================== */}
      <View style={styles.mainContent}>
        {/* SECTION FOTO PROFIL BULAT DI TENGAH AGAK ATAS */}
        <View style={styles.profileImageSection}>
          <TouchableOpacity
            style={[
              styles.imageContainerBig,
              { backgroundColor: colors.isDark ? "#334155" : "#E2E8F0" },
            ]}
            onPress={pickImage}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImageBig}
              />
            ) : (
              <View
                style={[
                  styles.profileImagePlaceholder,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons name="person" size={50} color={colors.subtext} />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.clickToEditHint, { color: colors.subtext }]}>
            Ketuk foto untuk mengganti
          </Text>
        </View>

        {/* SECTION FIELD DATA USER (READ ONLY) */}
        <View
          style={[
            styles.infoFormCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.fieldLabel, { color: colors.subtext }]}>
            Username
          </Text>
          <TextInput
            style={[
              styles.disabledInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={userData?.username}
            editable={false}
          />

          <Text style={[styles.fieldLabel, { color: colors.subtext }]}>
            Email Address
          </Text>
          <TextInput
            style={[
              styles.disabledInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={userData?.email}
            editable={false}
          />

          <Text style={[styles.fieldLabel, { color: colors.subtext }]}>
            Password
          </Text>
          <TextInput
            style={[
              styles.disabledInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value="********"
            secureTextEntry={true}
            editable={false}
          />
        </View>
      </View>

      {/* ==================== 💎 MODAL PREVIEW / CROP CUSTOM PREMIUM 💎 ==================== */}
      <Modal
        visible={isPreviewModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (!isUploading) setIsPreviewModalOpen(false);
        }}
      >
        <View style={styles.modalCustomOverlay}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

          <View style={styles.modalCustomHeader}>
            <Text style={styles.modalCustomTitle}>Sesuaikan Foto Profil</Text>
          </View>

          {/* AREA INTERAKTIF GESER GAMBAR */}
          <View style={styles.cropWindowArea} {...panResponder.panHandlers}>
            <Animated.View style={{ transform: pan.getTranslateTransform() }}>
              {tempImageUri && (
                <Image
                  source={{ uri: tempImageUri }}
                  style={styles.modalFullImage}
                  resizeMode="contain"
                />
              )}
            </Animated.View>

            {/* SISTEM LAYOUT MASKING: Lingkaran tengah terang benderang */}
            <View style={styles.maskOverlayContainer} pointerEvents="none">
              <View style={styles.maskTop} />
              <View style={styles.maskMiddleRow}>
                <View style={styles.maskSide} />
                <View style={styles.maskCircleHole} />
                <View style={styles.maskSide} />
              </View>
              <View style={styles.maskBottom} />
            </View>
          </View>

          {/* BARIS TOMBOL DESIGN PREMIUM */}
          <View style={styles.modalCustomFooter}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => setIsPreviewModalOpen(false)}
              disabled={isUploading}
            >
              <Text style={styles.modalBtnTextCancel}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnConfirm]}
              onPress={handleConfirmUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalBtnTextConfirm}>Gunakan Foto</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================== SIDEBAR / DRAWER MENU MODULAR ==================== */}
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
    padding: 24,
    alignItems: "center",
  },
  profileImageSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  imageContainerBig: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileImageBig: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  profileImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  editIconBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#2563EB",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  clickToEditHint: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  infoFormCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginLeft: 2,
  },
  disabledInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 18,
    borderWidth: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  modalCustomOverlay: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "space-between",
  },
  modalCustomHeader: {
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
    alignItems: "center",
  },
  modalCustomTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  cropWindowArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  modalFullImage: {
    width: width,
    height: height * 0.6,
  },
  maskOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  maskTop: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  maskMiddleRow: {
    flexDirection: "row",
    height: width * 0.75,
    width: "100%",
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  maskCircleHole: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    borderWidth: 2,
    borderColor: "#2563EB",
    backgroundColor: "transparent",
  },
  maskBottom: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  modalCustomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    paddingTop: 20,
  },
  modalBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "47%",
  },
  modalBtnCancel: {
    backgroundColor: "#334155",
  },
  modalBtnConfirm: {
    backgroundColor: "#2563EB",
  },
  modalBtnTextCancel: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalBtnTextConfirm: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
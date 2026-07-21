import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
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

const { width } = Dimensions.get("window");
const API_URL = "https://detract-parabola-moistness.ngrok-free.dev";

// Struktur Data Soal Adaptif 4 Variasi
interface SoalAI {
  no: number;
  tipe_soal?: "standar" | "full" | "drag_drop" | "fill_blank";
  pertanyaan: string;
  pilihan: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  jawaban_benar: string | string[];
}

// 💡 PEMBERSIH KATA OTOMATIS (MENGABAIKAN HARAKAT ARAB & HURUF BESAR/KECIL)
const bersihkanDanLuruskanTeks = (teks: string): string => {
  if (!teks) return "";
  return teks
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670]/g, "") // Hapus total tanda harakat Tajwid Al-Qur'an
    .replace(/[أإآ]/g, "ا"); // Penyelarasan Alif Hamzah agar tidak kaku
};

// 💡 LOGIKA PENGUJI JAWABAN TOLERAN MULTI-VARIAN
const checkApakahBenar = (soal: SoalAI, jawabanUserText: string): boolean => {
  if (!soal) return false;
  const targetUser = jawabanUserText || "";

  if (soal.tipe_soal === "fill_blank") {
    const cleanUser = bersihkanDanLuruskanTeks(targetUser);
    
    // Jika format berbentuk array bawaan backend
    if (Array.isArray(soal.jawaban_benar)) {
      return soal.jawaban_benar.some(opsi => bersihkanDanLuruskanTeks(opsi) === cleanUser);
    }
    
    // Antisipasi jika AI mengirim string tunggal atau string representasi array
    if (typeof soal.jawaban_benar === "string") {
      try {
        if (soal.jawaban_benar.startsWith("[")) {
          const parsed: string[] = JSON.parse(soal.jawaban_benar);
          return parsed.some(opsi => bersihkanDanLuruskanTeks(opsi) === cleanUser);
        }
      } catch (e) {}
      return bersihkanDanLuruskanTeks(soal.jawaban_benar) === cleanUser;
    }
    return false;
  }
  
  // Berlaku untuk standar, full_arab, dan drag_drop (Mencocokkan Abjad A/B/C/D)
  return soal.jawaban_benar === targetUser;
};

export default function ReviewJawabanKuis() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { judul_bab, sumber_data } = params;

  // --- STATE LAYOUT ---
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // --- STATE DATA REVIEW ---
  const [listSoal, setListSoal] = useState<SoalAI[]>([]);
  const [jawabanUser, setJawabanUser] = useState<Record<number, string>>({});
  const [indeksAktif, setIndeksAktif] = useState(0);
  const [skor, setSkor] = useState(0);

  // --- STATE MODAL PERINGATAN KELUAR ---
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitTarget, setExitTarget] = useState<"dashboard" | "profile" | "pengaturan">("dashboard");
  const fadeExitAnim = useRef(new Animated.Value(0)).current;
  const scaleExitAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../../../../auth/login");
        return;
      }
      const parsedSession = JSON.parse(session);
      setUserData({
        username: parsedSession.username || "User",
        email: parsedSession.email || "",
      });

      // 💡 AMBIL FOTO PROFIL: Kueri otomatis ke backend PHP
      try {
        const responseProfile = await fetch(`${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`);
        const dataProfile = await responseProfile.json();
        if (dataProfile.status === "success" && dataProfile.profile_image) {
          setProfileImage(`${API_URL}/ambativasi-api/${dataProfile.profile_image}`);
        }
      } catch (e) {
        console.log("Avatar gagal disinkronkan di review kuis", e);
      }

      const dataSoalRaw = await AsyncStorage.getItem("dataSoalKuis");
      const jawabanUserRaw = await AsyncStorage.getItem("jawabanUserKuis");

      if (dataSoalRaw && jawabanUserRaw) {
        const parsedSoal = JSON.parse(dataSoalRaw);
        const parsedJawaban = JSON.parse(jawabanUserRaw);
        setListSoal(parsedSoal);
        setJawabanUser(parsedJawaban);

        let tempSkor = 0;
        parsedSoal.forEach((soal: SoalAI, index: number) => {
          if (checkApakahBenar(soal, parsedJawaban[index])) {
            tempSkor++;
          }
        });
        setSkor(tempSkor);
      } else {
        router.back();
      }
    } catch (error) {
      console.log("Gagal memuat data review", error);
      router.back();
    } finally {
      setLoading(false);
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

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Log Out",
      "Apakah kamu yakin ingin keluar dari akun Ambativasi?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Ya, Keluar",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("userSession");
              toggleSidebar(false);
              router.replace("../../../../auth/login");
            } catch (error) {
              console.log("Gagal menghapus session", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBukaModalKeluar = (target: "dashboard" | "profile" | "pengaturan" = "dashboard") => {
    setExitTarget(target);
    toggleSidebar(false);
    setShowExitModal(true);
    Animated.parallel([
      Animated.timing(fadeExitAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleExitAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const handleTutupModalKeluar = () => {
    Animated.parallel([
      Animated.timing(fadeExitAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleExitAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowExitModal(false));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  const soalSaatIni = listSoal[indeksAktif];
  const jenisTipe = soalSaatIni?.tipe_soal || "standar";
  
  const isCurrentCorrect = checkApakahBenar(soalSaatIni, jawabanUser[indeksAktif]);
  const jawabanSalah = !isCurrentCorrect;

  // 💡 DETEKSI MATERI TAJWID & AL-FATIHAH SECARA PRESISI
  const isMateriTajwid = 
    sumber_data?.toString().toUpperCase().includes("TJ") || 
    sumber_data?.toString().toLowerCase().includes("tajwid") ||
    sumber_data?.toString().toLowerCase().includes("fatihah") ||
    sumber_data?.toString().toLowerCase().includes("al-fatihah") ||
    judul_bab?.toString().toLowerCase().includes("tajwid") ||
    judul_bab?.toString().toLowerCase().includes("fatihah") ||
    judul_bab?.toString().toLowerCase().includes("al-fatihah");

  const wajibRTL = jenisTipe === "full" && isMateriTajwid;

  const renderTeksPertanyaanReview = (fullText: string) => {
    if (!fullText.includes("___")) return fullText;
    let isian = jawabanUser[indeksAktif];
    
    if (isian && jenisTipe !== "fill_blank") {
      isian = soalSaatIni?.pilihan[isian as keyof typeof soalSaatIni.pilihan] || isian;
    }
    
    return fullText.replace("___", ` [ ${isian || "Tidak Diisi"} ] `);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ==================== NAVBAR ATAS ==================== */}
      <Navbar
        onOpenSidebar={() => toggleSidebar(true)}
        userData={userData}
        profileImage={profileImage}
      />

      {/* ==================== KONTEN UTAMA ==================== */}
      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#16A34A" />
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Review Hasil: {judul_bab || "Ujian AI"}</Text>

        {/* RINGKASAN SKOR */}
        <View style={styles.kartuSkor}>
          <View style={styles.infoSkorUtama}>
            <Text style={styles.labelTotalSkor}>Skor Kamu</Text>
            <Text style={styles.teksSkor}>{skor} <Text style={styles.teksTotalSoal}>/ {listSoal.length}</Text></Text>
          </View>
          <View style={styles.pembatasSkor} />
          <View style={styles.infoPersentase}>
            <Ionicons name="analytics" size={24} color="#2563EB" />
            <Text style={styles.teksPersen}>{Math.round((skor / (listSoal.length || 1)) * 100)}%</Text>
            <Text style={styles.labelPersen}>Akurasi</Text>
          </View>
        </View>

        {/* NAVIGASI NOMOR SOAL */}
        <View style={{ marginBottom: 15 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrapperAngka}>
            {listSoal.map((soal, indeks) => {
              const isCorrect = checkApakahBenar(soal, jawabanUser[indeks]);
              return (
                <TouchableOpacity
                  key={indeks}
                  style={[
                    styles.tombolAngka,
                    indeksAktif === indeks && styles.angkaAktif,
                    indeksAktif !== indeks && (isCorrect ? styles.angkaBenar : styles.angkaSalah)
                  ]}
                  onPress={() => setIndeksAktif(indeks)}
                >
                  <Text style={[styles.teksAngka, { color: "#fff" }]}>
                    {indeks + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* KARTU PERTANYAAN */}
        <View style={[styles.kartuSoal, wajibRTL && styles.kartuSoalArab]}>
          <View style={styles.rowTipeReviewBadge}>
            <Text style={styles.nomorSoalTitle}>Pertanyaan {indeksAktif + 1}</Text>
            <View style={styles.badgeMiniTipe}><Text style={styles.txtMiniTipe}>{jenisTipe.toUpperCase()}</Text></View>
          </View>
          
          <Text style={[styles.teksPertanyaan, wajibRTL && styles.teksPertanyaanArab]}>
            {renderTeksPertanyaanReview(soalSaatIni?.pertanyaan)}
          </Text>
          
          <View style={[styles.badgeStatus, jawabanSalah ? styles.badgeSalah : styles.badgeBenar]}>
            <Ionicons 
              name={jawabanSalah ? "close-circle" : "checkmark-circle"} 
              size={16} 
              color={jawabanSalah ? "#EF4444" : "#16A34A"} 
            />
            <Text style={[styles.teksStatus, { color: jawabanSalah ? "#EF4444" : "#16A34A" }]}>
              {jawabanSalah ? "Jawaban Kamu Salah" : "Jawaban Kamu Benar"}
            </Text>
          </View>
        </View>

        {/* DAFTAR DATA VERIFIKASI SELEKTIF JAWABAN */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {jenisTipe === "fill_blank" ? (
            <View style={styles.boxReviewBlank}>
              <Text style={styles.labelReviewBlank}>Jawaban Input Teks Kamu:</Text>
              <View style={[styles.inputReviewBlankBox, isCurrentCorrect ? styles.borderBenar : styles.borderSalah]}>
                <Text style={[styles.textReviewBlankUser, { color: isCurrentCorrect ? "#16A34A" : "#EF4444" }]}>
                  {jawabanUser[indeksAktif] || "(Kosong / Tidak Mengisi)"}
                </Text>
                <Ionicons name={isCurrentCorrect ? "checkmark-circle" : "close-circle"} size={20} color={isCurrentCorrect ? "#16A34A" : "#EF4444"} />
              </View>
              
              <Text style={[styles.labelReviewBlank, { marginTop: 14 }]}>Variasi Alternatif Jawaban Yang Sah & Diterima:</Text>
              <View style={styles.boxAcceptedVariants}>
                {soalSaatIni && (Array.isArray(soalSaatIni.jawaban_benar) ? (
                  soalSaatIni.jawaban_benar.map((kata, i) => (
                    <View key={i} style={styles.chipVariant}><Text style={styles.textChipVariant}>{kata}</Text></View>
                  ))
                ) : (
                  <View style={styles.chipVariant}><Text style={styles.textChipVariant}>{String(soalSaatIni?.jawaban_benar)}</Text></View>
                ))}
              </View>
            </View>
          ) : (
            soalSaatIni && soalSaatIni.pilihan && Object.entries(soalSaatIni.pilihan).map(([abjad, teksOpsi]) => {
              const isUserAnswer = jawabanUser[indeksAktif] === abjad;
              const isCorrectAnswer = soalSaatIni.jawaban_benar === abjad;
              const isWrongUserAnswer = isUserAnswer && jawabanSalah;

              let iconKanan = null;
              if (isCorrectAnswer) {
                iconKanan = <Ionicons name="checkmark-circle" size={20} color="#16A34A" />;
              } else if (isWrongUserAnswer) {
                iconKanan = <Ionicons name="close-circle" size={20} color="#EF4444" />;
              }

              return (
                <View 
                  key={abjad} 
                  style={[
                    styles.tombolOpsi,
                    isCorrectAnswer && styles.opsiBenarKunci,
                    isWrongUserAnswer && styles.opsiSalahUser,
                    wajibRTL && { flexDirection: 'row-reverse' }
                  ]}
                >
                  <View 
                    style={[
                      styles.badgeAbjad,
                      isCorrectAnswer && styles.badgeOpsiBenar,
                      isWrongUserAnswer && styles.badgeOpsiSalah
                    ]}
                  >
                    <Text style={[styles.teksAbjad, (isCorrectAnswer || isWrongUserAnswer) && { color: "#fff" }]}>
                      {abjad}
                    </Text>
                  </View>
                  <Text 
                    style={[
                      styles.teksOpsiText,
                      wajibRTL && styles.teksOpsiArab,
                      isCorrectAnswer && styles.teksOpsiBenar,
                      isWrongUserAnswer && styles.teksOpsiSalah
                    ]}
                  >
                    {teksOpsi}
                  </Text>
                  {iconKanan}
                </View>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* TOMBOL NAVIGASI BAWAH */}
        <View style={styles.navigasiBawah}>
          <TouchableOpacity
            disabled={indeksAktif === 0}
            style={[styles.tombolNav, indeksAktif === 0 && { opacity: 0.4 }]}
            onPress={() => setIndeksAktif(indeksAktif - 1)}
          >
            <Text style={styles.teksNav}>◄ Sebelumnya</Text>
          </TouchableOpacity>

          {indeksAktif === listSoal.length - 1 ? (
            <TouchableOpacity style={[styles.tombolNav, { backgroundColor: "#16A34A" }]} onPress={() => router.back()}>
              <Text style={styles.teksNav}>Selesai Review ✔</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tombolNav} onPress={() => setIndeksAktif(indeksAktif + 1)}>
              <Text style={styles.teksNav}>Selanjutnya ►</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ==================== SIDEBAR DRAWER MENU ==================== */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar(false)}
        slideAnim={slideAnim}
        userData={userData}
        profileImage={profileImage}
        onLogout={handleLogout}
        onNavigateDashboard={() => handleBukaModalKeluar("dashboard")}
        onNavigateProfile={() => handleBukaModalKeluar("profile")}
        onNavigateSettings={() => handleBukaModalKeluar("pengaturan")}
      />

      {/* ==================== MODAL PERINGATAN KELUAR ==================== */}
      <Modal visible={showExitModal} transparent={true} statusBarTranslucent={true} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeExitAnim, transform: [{ scale: scaleExitAnim }] }]}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="warning" size={76} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Meninggalkan Review?</Text>
            <Text style={styles.modalSubtitle}>Apakah kamu yakin ingin keluar dari halaman review jawaban?</Text>
            <TouchableOpacity style={styles.modalButtonUtama} onPress={handleTutupModalKeluar}>
              <Text style={styles.modalButtonText}>Tidak, Lanjutkan Review</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalButtonKeluarYa} 
              onPress={() => { 
                setShowExitModal(false); 
                if (exitTarget === "dashboard") {
                  router.replace("/(tabs)"); 
                } else if (exitTarget === "profile") {
                  router.push("/profile");
                } else if (exitTarget === "pengaturan") {
                  router.push("/pengaturan");
                }
              }}
            >
              <Text style={styles.modalButtonTextKeluarYa}>Ya, Keluar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  backButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginBottom: 12 },
  backButtonText: { fontSize: 15, fontWeight: "600", color: "#16A34A", marginLeft: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B", marginBottom: 16 },
  wrapperAngka: { paddingVertical: 4 },
  tombolAngka: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: "#CBD5E1" },
  teksAngka: { fontSize: 14, fontWeight: "bold" },
  kartuSoal: { backgroundColor: "#FFF", padding: 18, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", elevation: 1 },
  kartuSoalArab: { borderColor: "#2563EB", backgroundColor: "#F8FAFF" },
  nomorSoalTitle: { fontSize: 12, color: "#94A3B8", fontWeight: "bold" },
  teksPertanyaan: { fontSize: 16, color: "#1E293B", lineHeight: 24, fontWeight: "500", marginBottom: 12 },
  teksPertanyaanArab: { fontSize: 22, textAlign: 'right', lineHeight: 38, color: "#1E293B", fontWeight: "600" },
  tombolOpsi: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  badgeAbjad: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  teksAbjad: { fontWeight: "bold", color: "#64748B", fontSize: 14 },
  teksOpsiText: { flex: 1, fontSize: 15, color: "#334155" },
  teksOpsiArab: { fontSize: 19, textAlign: "right", paddingHorizontal: 10 },
  navigasiBawah: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  tombolNav: { backgroundColor: "#1E293B", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8 },
  teksNav: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  angkaAktif: { backgroundColor: "#1E293B", borderColor: "#1E293B", borderWidth: 2 },
  angkaBenar: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  angkaSalah: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  badgeStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#F8FAFC", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4, borderWidth: 1, borderColor: "#E2E8F0" },
  badgeBenar: { backgroundColor: "#F0FDF4", borderColor: "#DCFCE7" },
  badgeSalah: { backgroundColor: "#FEF2F2", borderColor: "#FEE2E2" },
  teksStatus: { fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  opsiBenarKunci: { borderColor: "#16A34A", backgroundColor: "#F0FDF4", borderWidth: 2 },
  opsiSalahUser: { borderColor: "#EF4444", backgroundColor: "#FEF2F2", borderWidth: 2 },
  badgeOpsiBenar: { backgroundColor: "#16A34A" },
  badgeOpsiSalah: { backgroundColor: "#EF4444" },
  teksOpsiBenar: { flex: 1, fontSize: 15, color: "#16A34A", fontWeight: "600" },
  teksOpsiSalah: { flex: 1, fontSize: 15, color: "#EF4444", fontWeight: "600" },
  kartuSkor: { flexDirection: 'row', backgroundColor: "#FFF", padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", alignItems: 'center', elevation: 1 },
  infoSkorUtama: { flex: 1, alignItems: 'center' },
  labelTotalSkor: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  teksSkor: { fontSize: 28, fontWeight: 'bold', color: "#1E293B" },
  teksTotalSoal: { fontSize: 16, color: "#94A3B8", fontWeight: 'normal' },
  pembatasSkor: { width: 1, height: '80%', backgroundColor: "#E2E8F0", marginHorizontal: 15 },
  infoPersentase: { flex: 1, alignItems: 'center' },
  teksPersen: { fontSize: 20, fontWeight: 'bold', color: "#2563EB", marginTop: 4 },
  labelPersen: { fontSize: 11, color: "#94A3B8", marginTop: 1 },

  rowTipeReviewBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badgeMiniTipe: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  txtMiniTipe: { fontSize: 9, fontWeight: 'bold', color: '#64748B' },
  boxReviewBlank: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  labelReviewBlank: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  inputReviewBlankBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F8FAFC' },
  borderBenar: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  borderSalah: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textReviewBlankUser: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  boxAcceptedVariants: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chipVariant: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  textChipVariant: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", backgroundColor: "#FFF", borderRadius: 24, padding: 24, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalIconWrapper: { marginBottom: 16, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#1E293B", marginBottom: 8 },
  modalSubtitle: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  modalButtonUtama: { backgroundColor: "#16A34A", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  modalButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalButtonKeluarYa: { backgroundColor: "#EF4444", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#DC2626" },
  modalButtonTextKeluarYa: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
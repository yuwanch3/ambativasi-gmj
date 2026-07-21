import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router"; 
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 💡 IMPORT KOMPONEN MODULAR NAVBAR & SIDEBAR
import { Navbar } from "../../../../../components/navbar";
import { Sidebar } from "../../../../../components/sidebar";

// 💡 IMPORT DIRECT GEMINI SERVICE
import { generateSoalDirectGemini } from "../../../../../src/service/geminiService";

const { width } = Dimensions.get("window");

interface SoalAI {
  no: number;
  tipe_soal: "standar" | "full" | "drag_drop" | "fill_blank";
  pertanyaan: string;
  pilihan?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  jawaban_benar: string | string[];
}

const API_URL = "https://detract-parabola-moistness.ngrok-free.dev"; 

// ==========================================
// KOMPONEN JARI DRAGGABLE KATA INTERAKTIF
// ==========================================
interface DraggableChipProps {
  abjad: string;
  teks: string;
  onDropSuccess: (abjad: string) => void;
  dropZoneLayout: any;
  isUsed: boolean;
}

function DraggableChip({ abjad, teks, onDropSuccess, dropZoneLayout, isUsed }: DraggableChipProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isUsed) {
      pan.setValue({ x: 0, y: 0 });
    }
  }, [isUsed]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isUsed,
      onMoveShouldSetPanResponder: () => !isUsed,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gestureState) => {
        setIsDragging(false);
        
        if (dropZoneLayout.current) {
          const { absoluteX, absoluteY, width: dzW, height: dzH } = dropZoneLayout.current;
          const touchX = gestureState.moveX;
          const touchY = gestureState.moveY;

          if (
            touchX >= absoluteX &&
            touchX <= absoluteX + dzW &&
            touchY >= absoluteY &&
            touchY <= absoluteY + dzH
          ) {
            onDropSuccess(abjad);
          }
        }

        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  if (isUsed) {
    return <View style={[styles.chipKataDrag, styles.chipKataPlaceholder]} />;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        { transform: pan.getTranslateTransform() },
        styles.chipKataDrag,
        isDragging && styles.chipKataActiveDrag,
      ]}
    >
      <Text style={styles.txtChipKata}>{teks}</Text>
    </Animated.View>
  );
}

// ==========================================
// HALAMAN UTAMA LATIHAN SOAL KUIS
// ==========================================
export default function SubUjianNihongo() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { tipe_sumber, sumber_data, judul_bab } = params;

  // --- STATE LAYOUT ---
  const [loadingSession, setLoadingSession] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width));
  const [userData, setUserData] = useState<{ username: string; email: string } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // --- STATE KUIS AI ---
  const [listSoal, setListSoal] = useState<SoalAI[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const [indeksAktif, setIndeksAktif] = useState(0);
  const [jawabanUser, setJawabanUser] = useState<Record<number, string>>({});
  const [shuffledOptions, setShuffledOptions] = useState<[string, string][]>([]);

  // --- REF PENAHAN LAYOUT DROP ZONE ---
  const dropZoneRef = useRef<View>(null);
  const dropZoneLayoutData = useRef<any>(null);

  // --- STATE CUSTOM MODAL & ANIMASI ---
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [showExitModal, setShowExitModal] = useState(false);
  const [exitTarget, setExitTarget] = useState<"back" | "dashboard" | "profile" | "pengaturan">("back");
  
  const fadeExitAnim = useRef(new Animated.Value(0)).current;
  const scaleExitAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (listSoal.length > 0 && listSoal[indeksAktif]) {
      const targetSoal = listSoal[indeksAktif];
      if (targetSoal.pilihan) {
        const opsiAsli = Object.entries(targetSoal.pilihan);
        const opsiAcak = [...opsiAsli].sort(() => Math.random() - 0.5);
        setShuffledOptions(opsiAcak);
      } else {
        setShuffledOptions([]);
      }
    }
  }, [indeksAktif, listSoal]);

  useEffect(() => {
    const backAction = () => {
      if (!loadingAI && !loadingSession && !showFinishedModal) {
        handleBukaModalKeluar("back");
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [loadingAI, loadingSession, showFinishedModal]);

  const checkSession = async () => {
    try {
      const session = await AsyncStorage.getItem("userSession");
      if (session === null) {
        router.replace("../../../../auth/login");
      } else {
        const parsedSession = JSON.parse(session);
        setUserData({ username: parsedSession.username || "User", email: parsedSession.email || "" });

        try {
          const responseProfile = await fetch(`${API_URL}/ambativasi-api/get-profile.php?email=${parsedSession.email}`);
          const dataProfile = await responseProfile.json();
          if (dataProfile.status === "success" && dataProfile.profile_image) {
            setProfileImage(`${API_URL}/ambativasi-api/${dataProfile.profile_image}`);
          }
        } catch (e) {
          console.log("Avatar gagal dimuat kawan", e);
        }

        setLoadingSession(false);
        ambilSoalLangsungDariAI();
      }
    } catch (error) {
      router.replace("../../../../auth/login");
    }
  };

  const ambilSoalLangsungDariAI = async () => {
    try {
      setLoadingAI(true);
      const dataSoal = await generateSoalDirectGemini(sumber_data ? String(sumber_data) : "nihongo_bab1", 10);
      setListSoal(dataSoal);
    } catch (error: any) {
      Alert.alert("Error Gemini", error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const toggleSidebar = (open: boolean) => {
    if (open) {
      setIsSidebarOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: false }).start(() => setIsSidebarOpen(false));
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userSession");
    router.replace("../../../../auth/login");
  };

  const pilihJawaban = (nilai: string) => {
    setJawabanUser({ ...jawabanUser, [indeksAktif]: nilai });
  };

  const bersihkanJawabanDrag = () => {
    const dataBaru = { ...jawabanUser };
    delete dataBaru[indeksAktif];
    setJawabanUser(dataBaru);
  };

  const handleSelesaiKuis = () => {
    setShowFinishedModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const navigasiKeReview = async () => {
    try {
      await AsyncStorage.setItem("dataSoalKuis", JSON.stringify(listSoal));
      await AsyncStorage.setItem("jawabanUserKuis", JSON.stringify(jawabanUser));
      setShowFinishedModal(false);
      router.push({
        pathname: "./reviewJawaban",
        params: { 
          judul_bab: String(judul_bab || "Latihan Soal AI"), 
          tipe_sumber: String(tipe_sumber || "text"), 
          sumber_data: String(sumber_data || "nihongo_bab1") 
        },
      });
    } catch (e) {
      Alert.alert("Error", "Gagal memuat review kuis.");
    }
  };

  const handleBukaModalKeluar = (target: "back" | "dashboard" | "profile" | "pengaturan" = "back") => {
    setExitTarget(target);
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

  const ukurDropZone = () => {
    if (dropZoneRef.current) {
      setTimeout(() => {
        dropZoneRef.current?.measure((x, y, w, h, px, py) => {
          if (w > 0 && h > 0) {
            dropZoneLayoutData.current = { absoluteX: px, absoluteY: py, width: w, height: h };
          }
        });
      }, 100);
    }
  };

  if (loadingSession || loadingAI) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.teksLoading}>Sedang meracik 10 butir soal latihan via AI...</Text>
      </View>
    );
  }

  const soalSaatIni = listSoal[indeksAktif];
  const jenisTipe = soalSaatIni?.tipe_soal || "standar";
  const userHasPicked = jawabanUser[indeksAktif];

  const isMateriTajwid = 
    sumber_data?.toString().toUpperCase().includes("TJ") || 
    judul_bab?.toString().toLowerCase().includes("tajwid") ||
    judul_bab?.toString().toLowerCase().includes("fatihah");

  const wajibRTL = jenisTipe === "full" && isMateriTajwid;

  const renderTeksDragDrop = (fullText: string) => {
    if (!fullText.includes("___")) return <Text style={styles.teksPertanyaan}>{fullText}</Text>;
    const bagian = fullText.split("___");
    return (
      <View style={[styles.dragTextRow, wajibRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.teksPertanyaan}>{bagian[0]}</Text>
        <TouchableOpacity
          ref={dropZoneRef}
          onLayout={ukurDropZone}
          activeOpacity={0.8}
          onPress={bersihkanJawabanDrag}
          style={[styles.dropZoneBox, userHasPicked && styles.dropZoneBoxIsi]}
        >
          <Text style={[styles.dropZoneText, userHasPicked && { color: '#FFF' }]}>
            {userHasPicked && soalSaatIni?.pilihan ? soalSaatIni.pilihan[userHasPicked as keyof typeof soalSaatIni.pilihan] : " Tarik Ke Sini "}
          </Text>
        </TouchableOpacity>
        <Text style={styles.teksPertanyaan}>{bagian[1]}</Text>
      </View>
    );
  };

  const renderTeksFillBlank = (fullText: string) => {
    if (!fullText.includes("___")) return <Text style={styles.teksPertanyaan}>{fullText}</Text>;
    const bagian = fullText.split("___");
    return (
      <View style={[styles.dragTextRow, wajibRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.teksPertanyaan}>{bagian[0]}</Text>
        <TextInput
          style={styles.inputTeksBlank}
          placeholder="Ketik..."
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          value={userHasPicked || ""}
          onChangeText={(teks) => pilihJawaban(teks)}
        />
        <Text style={styles.teksPertanyaan}>{bagian[1]}</Text>
      </View>
    );
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
        <TouchableOpacity style={styles.backButton} onPress={() => handleBukaModalKeluar("back")}>
          <Ionicons name="arrow-back" size={20} color="#16A34A" />
          <Text style={styles.backButtonText}>Kembali ke BAB</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{judul_bab || "Latihan Soal AI"}</Text>

        {/* --- NAVIGASI NOMOR SOAL --- */}
        <View style={{ marginBottom: 15 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrapperAngka}>
            {listSoal.map((_, indeks) => (
              <TouchableOpacity
                key={indeks}
                style={[
                  styles.tombolAngka,
                  indeksAktif === indeks && styles.angkaAktif,
                  jawabanUser[indeks] !== undefined && indeksAktif !== indeks && styles.angkaSudahDijawab,
                ]}
                onPress={() => setIndeksAktif(indeks)}
              >
                <Text style={[styles.teksAngka, (indeksAktif === indeks || jawabanUser[indeks] !== undefined) && { color: "#fff" }]}>
                  {indeks + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* --- KARTU PERTANYAAN DINAMIS --- */}
        <View style={[styles.kartuSoal, wajibRTL && styles.kartuSoalArab]}>
          <View style={styles.rowTipeBadge}>
            <Text style={styles.nomorSoalTitle}>Pertanyaan {indeksAktif + 1} dari {listSoal.length}</Text>
            <View style={[styles.badgeTipeSoal, jenisTipe === "drag_drop" ? styles.bgTipeDrag : jenisTipe === "full" ? styles.bgTipeArab : jenisTipe === "fill_blank" ? styles.bgTipeBlank : styles.bgTipeStandar]}>
              <Text style={styles.txtTipeBadge}>{jenisTipe.toUpperCase()}</Text>
            </View>
          </View>
          
          {jenisTipe === "drag_drop" ? (
            renderTeksDragDrop(soalSaatIni?.pertanyaan)
          ) : jenisTipe === "fill_blank" ? (
            renderTeksFillBlank(soalSaatIni?.pertanyaan)
          ) : (
            <Text style={[styles.teksPertanyaan, wajibRTL && styles.teksPertanyaanArab]}>
              {soalSaatIni?.pertanyaan}
            </Text>
          )}
        </View>

        {/* --- AREA PILIHAN JAWABAN --- */}
        {jenisTipe === "drag_drop" ? (
          <View style={styles.dragDropWrapper}>
            <Text style={styles.pilihKataLabel}>Seret kata melayang di bawah ke kotak putus-putus. Tap kotak jawaban untuk membatalkan:</Text>
            <View style={styles.wordBankGrid}>
              {shuffledOptions.map(([abjad, teksOpsi]) => (
                <DraggableChip
                  key={abjad}
                  abjad={abjad}
                  teks={teksOpsi}
                  onDropSuccess={pilihJawaban}
                  dropZoneLayout={dropZoneLayoutData}
                  isUsed={userHasPicked === abjad}
                />
              ))}
            </View>
          </View>
        ) : jenisTipe === "fill_blank" ? (
          <View style={{ flex: 1 }}>
            <View style={styles.fillBlankHintBox}>
              <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
              <Text style={styles.fillBlankHintText}>
                Gunakan keyboard smartphone kamu untuk mengetik isi kata yang dirasa paling tepat pada ruang input kosong di atas.
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {soalSaatIni && soalSaatIni.pilihan && Object.entries(soalSaatIni.pilihan).map(([abjad, teksOpsi]) => {
              const isSelected = userHasPicked === abjad;
              return (
                <TouchableOpacity
                  key={abjad}
                  style={[styles.tombolOpsi, isSelected && styles.opsiTerpilih, wajibRTL && { flexDirection: 'row-reverse' }]}
                  onPress={() => pilihJawaban(abjad)}
                >
                  <View style={[styles.badgeAbjad, isSelected && styles.badgeAbjadTerpilih]}>
                    <Text style={[styles.teksAbjad, isSelected && { color: "#fff" }]}>{abjad}</Text>
                  </View>
                  <Text style={[styles.teksOpsiText, wajibRTL && styles.teksOpsiArab, isSelected && { fontWeight: "600", color: "#16A34A" }]}>
                    {teksOpsi}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* --- TOMBOL NAVIGASI BAWAH --- */}
        <View style={styles.navigasiBawah}>
          <TouchableOpacity
            disabled={indeksAktif === 0}
            style={[styles.tombolNav, indeksAktif === 0 && { opacity: 0.4 }]}
            onPress={() => setIndeksAktif(indeksAktif - 1)}
          >
            <Text style={styles.teksNav}>◄ Sebelumnya</Text>
          </TouchableOpacity>

          {indeksAktif === listSoal.length - 1 ? (
            <TouchableOpacity style={[styles.tombolNav, { backgroundColor: "#16A34A" }]} onPress={handleSelesaiKuis}>
              <Text style={styles.teksNav}>Selesai ✔</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tombolNav} onPress={() => setIndeksAktif(indeksAktif + 1)}>
              <Text style={styles.teksNav}>Selanjutnya ►</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ==================== SIDEBAR ==================== */}
      {/* 💡 Sesuai instruksi: Menggunakan Sidebar modular sekaligus menjaga pemicu warning modal */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar(false)}
        slideAnim={slideAnim}
        userData={userData}
        profileImage={profileImage}
        onLogout={handleLogout}
        onNavigateDashboard={() => {
          toggleSidebar(false);
          handleBukaModalKeluar("dashboard");
        }}
        onNavigateProfile={() => {
          toggleSidebar(false);
          handleBukaModalKeluar("profile");
        }}
        onNavigateSettings={() => {
          toggleSidebar(false);
          handleBukaModalKeluar("pengaturan");
        }}
      />

      {/* ==================== MODAL SELESAI ==================== */}
      <Modal visible={showFinishedModal} transparent={true} statusBarTranslucent={true} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="checkmark-circle" size={80} color="#16A34A" />
            </View>
            <Text style={styles.modalTitle}>Kuis Selesai!</Text>
            <Text style={styles.modalSubtitle}>Selamat, kamu telah menyelesaikan kuis latihan variasi ini.</Text>
            <TouchableOpacity style={styles.modalButtonUtama} onPress={navigasiKeReview}>
              <Text style={styles.modalButtonText}>Lihat Review Jawaban ►</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonSekunder} onPress={() => { setShowFinishedModal(false); fadeAnim.setValue(0); scaleAnim.setValue(0.8); router.back(); }}>
              <Text style={styles.modalButtonTextSekunder}>Kembali ke Bab</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ==================== MODAL PERINGATAN KELUAR ==================== */}
      <Modal visible={showExitModal} transparent={true} statusBarTranslucent={true} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { opacity: fadeExitAnim, transform: [{ scale: scaleExitAnim }] }]}>
            <View style={styles.modalIconWrapper}>
              <Ionicons name="warning" size={76} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Meninggalkan Kuis?</Text>
            <Text style={styles.modalSubtitle}>Apakah kamu yakin ingin keluar? Seluruh progres saat ini akan hilang.</Text>
            <TouchableOpacity style={styles.modalButtonUtama} onPress={handleTutupModalKeluar}>
              <Text style={styles.modalButtonText}>Tidak, Lanjutkan Latihan</Text>
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
                } else { 
                  router.back(); 
                } 
              }}
            >
              <Text style={styles.modalButtonTextKeluarYa}>Ya, Saya Yakin Keluar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC", padding: 20 },
  teksLoading: { marginTop: 12, color: "#64748B", fontSize: 14, textAlign: "center" },
  mainContent: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  backButton: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginBottom: 16 },
  backButtonText: { fontSize: 15, fontWeight: "600", color: "#16A34A", marginLeft: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B", marginBottom: 16 },
  wrapperAngka: { paddingVertical: 4 },
  tombolAngka: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center", marginRight: 10, borderWidth: 1, borderColor: "#CBD5E1" },
  angkaAktif: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  angkaSudahDijawab: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  teksAngka: { fontSize: 14, fontWeight: "bold", color: "#475569" },
  kartuSoal: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", elevation: 1 },
  kartuSoalArab: { borderColor: "#2563EB", backgroundColor: "#F8FAFF" },
  nomorSoalTitle: { fontSize: 12, color: "#94A3B8", fontWeight: "bold", marginBottom: 6 },
  teksPertanyaan: { fontSize: 16, color: "#1E293B", lineHeight: 24, fontWeight: "500" },
  teksPertanyaanArab: { fontSize: 22, textAlign: "right", lineHeight: 38, color: "#1E293B", fontWeight: "600" },
  tombolOpsi: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  opsiTerpilih: { borderColor: "#16A34A", backgroundColor: "#F0FDF4", borderWidth: 2 },
  badgeAbjad: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  badgeAbjadTerpilih: { backgroundColor: "#16A34A" },
  teksAbjad: { fontWeight: "bold", color: "#64748B", fontSize: 14 },
  teksOpsiText: { flex: 1, fontSize: 15, color: "#334155" },
  teksOpsiArab: { fontSize: 19, textAlign: "right", paddingHorizontal: 10 },
  navigasiBawah: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  tombolNav: { backgroundColor: "#1E293B", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 8 },
  teksNav: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  
  rowTipeBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badgeTipeSoal: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bgTipeStandar: { backgroundColor: '#E2E8F0' },
  bgTipeArab: { backgroundColor: '#DBEAFE' },
  bgTipeDrag: { backgroundColor: '#DCFCE7' },
  bgTipeBlank: { backgroundColor: '#FEE2E2' },
  txtTipeBadge: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  dragTextRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', lineHeight: 40 },
  dropZoneBox: { minWidth: 120, height: 38, borderWidth: 2, borderStyle: 'dashed', borderColor: '#16A34A', borderRadius: 8, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginHorizontal: 6, paddingHorizontal: 10 },
  dropZoneBoxIsi: { borderStyle: 'solid', backgroundColor: '#16A34A' },
  dropZoneText: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', textAlign: 'center' },
  inputTeksBlank: { minWidth: 120, height: 38, borderWidth: 2, borderColor: '#2563EB', borderRadius: 8, backgroundColor: '#EFF6FF', paddingHorizontal: 10, fontSize: 14, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginHorizontal: 6 },
  dragDropWrapper: { flex: 1, paddingTop: 5, overflow: 'visible' },
  pilihKataLabel: { fontSize: 13, color: '#64748B', marginBottom: 10, fontStyle: 'italic', lineHeight: 18 },
  wordBankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingTop: 10, overflow: 'visible' },
  chipKataDrag: { backgroundColor: '#FFF', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', elevation: 2 },
  chipKataPlaceholder: { backgroundColor: '#E2E8F0', borderColor: '#CBD5E1', borderStyle: 'dashed', opacity: 0.4, elevation: 0 },
  chipKataActiveDrag: { backgroundColor: '#DCFCE7', borderColor: '#16A34A', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, zIndex: 99999 },
  txtChipKata: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  fillBlankHintBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', marginTop: 10 },
  fillBlankHintText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { width: "100%", backgroundColor: "#FFF", borderRadius: 24, padding: 24, alignItems: "center", elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalIconWrapper: { marginBottom: 16, marginTop: 8 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#1E293B", marginBottom: 8 },
  modalSubtitle: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  modalButtonUtama: { backgroundColor: "#16A34A", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  modalButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalButtonSekunder: { backgroundColor: "#F1F5F9", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  modalButtonTextSekunder: { color: "#475569", fontSize: 15, fontWeight: "600" },
  modalButtonKeluarYa: { backgroundColor: "#EF4444", width: "100%", paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#DC2626" },
  modalButtonTextKeluarYa: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
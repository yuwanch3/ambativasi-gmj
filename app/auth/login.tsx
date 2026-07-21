import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
// 1. TAMBAHKAN IMPORT USEEFFECT DI SINI
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. IMPORT TOAST DAN CONFIG URL KAMU
import Toast from "react-native-toast-message";
import BASE_URL from "../../config";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert, // Ditambahkan Alert bawaan untuk pop-up retry
} from "react-native";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =================================================================
  // TAMBAHAN LOGIC: CEK STATUS STATUS SERVER (PHP NGROK)
  // =================================================================
  const [isServerAlive, setIsServerAlive] = useState<boolean | null>(null);

  useEffect(() => {
    cekKoneksiServer();
  }, []);

  const cekKoneksiServer = async () => {
    try {
      // Menembak file cek-status.php di server XAMPP via gerbang Ngrok
      const response = await fetch(`${BASE_URL}/cek-status.php`, { method: "GET" });
      if (response.ok) {
        setIsServerAlive(true); // Server hidup, lolos masuk ke halaman login
      } else {
        throw new Error();
      }
    } catch (error) {
      setIsServerAlive(false); // Server mati / Ngrok mati
      Alert.alert(
        "Server Offline ⚙️",
        "Mohon maaf, server sedang dalam perbaikan atau dimatikan sementara. Silakan coba lagi nanti.",
        [{ text: "Coba Lagi", onPress: () => cekKoneksiServer() }]
      );
    }
  };
  // =================================================================

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      // Mengubah Alert polosan menjadi Toast Error dari atas
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Semua kolom wajib diisi!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    if (!emailRegex.test(email)) {
      // Mengubah Alert polosan menjadi Toast Error dari atas
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Format email tidak valid!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. MENGGUNAKAN BASE_URL YANG SUDAH KITA BUAT DI CONFIG
      const response = await fetch(`${BASE_URL}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const json = await response.json();

      if (json.success) {
        await AsyncStorage.setItem("userSession", JSON.stringify(json.user));

        // Mengubah Alert sukses menjadi Toast Sukses dari atas
        Toast.show({
          type: "success",
          text1: "Sukses",
          text2: json.message,
          position: "top",
          visibilityTime: 2000,
        });

        // Beri jeda sedikit agar user bisa melihat animasi toast sukses sebelum pindah halaman
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        // Mengubah Alert gagal login
        Toast.show({
          type: "error",
          text1: "Login Gagal",
          text2: json.message,
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.log(error);
      // Mengubah Alert gangguan jaringan
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Terjadi kesalahan jaringan atau server mati!",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =================================================================
  // TAMBAHAN RENDERING CONDITION (Ditempatkan sebelum return utama)
  // =================================================================
  if (isServerAlive === null) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: "#64748B" }}>Memeriksa koneksi server...</Text>
      </View>
    );
  }

  if (isServerAlive === false) {
    return (
      <View style={styles.centerLoading}>
        <Text style={styles.errorText}>⚠️ SERVER MAINTENANCE ⚠️</Text>
        <Text style={{ textAlign: "center", paddingHorizontal: 32, marginTop: 10, color: "#64748B", lineHeight: 20 }}>
          Aplikasi tidak dapat digunakan sementara waktu karena server pusat sedang mati atau dalam perbaikan.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={cekKoneksiServer}>
          <Text style={styles.loginButtonText}>Coba Hubungkan Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // =================================================================

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon-keren.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Ambativasi</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")}>
            <Text style={styles.registerText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },

  logo: {
    marginBottom: 10,
    width: 100,
    height: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },

  form: {
    width: "100%",
  },

  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 55,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  passwordContainer: {
    flexDirection: "row", // Mengembalikan ke setelan pabrik tanpa flex: 2
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    height: 55,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
  },

  eyeButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },

  forgotPassword: {
    textAlign: "right",
    color: "#2563EB",
    marginBottom: 24,
  },

  loginButton: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  registerText: {
    color: "#2563EB",
    fontWeight: "bold",
  },

  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },

  // =================================================================
  // TAMBAHAN STYLE BARU (Gak ganggu atau numpuk style bawaan kamu)
  // =================================================================
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#DC2626",
  },
  retryButton: {
    backgroundColor: "#2563EB",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 24,
  },
});
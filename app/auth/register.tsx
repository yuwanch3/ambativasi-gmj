import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. IMPORT TOAST DAN CONFIG CENTRAL URL
import Toast from "react-native-toast-message";
import BASE_URL from "../../config";

import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validasi input kosong diganti menggunakan Toast
    if (!username || !email || !password) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Semua kolom wajib diisi!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    // Validasi format email diganti menggunakan Toast
    if (!emailRegex.test(email)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Format email tidak valid!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    // Validasi panjang password diganti menggunakan Toast
    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Password minimal harus 6 karakter!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    try {
      // 2. MENGGUNAKAN TEMPLATE LITERAL BASE_URL SINKRON KE CONFIG
      const response = await fetch(`${BASE_URL}/register.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      const json = await response.json();

      if (json.success) {
        // Registrasi Sukses menggunakan Toast
        Toast.show({
          type: "success",
          text1: "Sukses",
          text2: json.message,
          position: "top",
          visibilityTime: 2000,
        });

        // Memberi jeda sedikit agar animasi toast sukses selesai sebelum dialihkan ke login
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      } else {
        // Registrasi Gagal dari server respons
        Toast.show({
          type: "error",
          text1: "Gagal",
          text2: json.message,
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.log(error);
      // Gangguan koneksi sistem
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Terjadi kesalahan jaringan atau IP salah!",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon-keren.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Ambativasi</Text>
        <Text style={styles.subtitle}>Sign Up to continue</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

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
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text>Have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.registerText}>Sign In</Text>
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
    flexDirection: "row",
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

  registerButton: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  registerButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },

  registerText: {
    color: "#2563EB",
    fontWeight: "bold",
  },
});

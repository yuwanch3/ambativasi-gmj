import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 1. IMPORT TOAST DAN CONFIG CENTRAL URL
import Toast from "react-native-toast-message";
import BASE_URL from "../../config";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async () => {
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

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Konfirmasi password tidak cocok!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

    try {
      // 2. MENGGUNAKAN TEMPLATE LITERAL BASE_URL SINKRON KE CONFIG
      const response = await fetch(`${BASE_URL}/update-password.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const json = await response.json();

      if (json.success) {
        // Notifikasi sukses update password menggunakan Toast
        Toast.show({
          type: "success",
          text1: "Sukses",
          text2: "Password berhasil diubah!",
          position: "top",
          visibilityTime: 2000,
        });

        // Beri jeda sedikit agar animasi toast sukses selesai sebelum dialihkan kembali ke login
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      } else {
        Toast.show({
          type: "error",
          text1: "Gagal",
          text2: json.message,
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Gagal terhubung ke server backend.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Buat Password Baru</Text>
      <Text style={styles.subtitle}>
        Masukkan password baru untuk email:{"\n"}
        {email}
      </Text>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password Baru"
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

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Konfirmasi Password Baru"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={22}
            color="#64748B"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
        <Text style={styles.buttonText}>Simpan & Login</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
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
  button: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

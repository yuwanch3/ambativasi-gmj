import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../../config";

// 1. IMPORT TOAST DAN CONFIG CENTRAL URL
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const handleResetPassword = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Silakan masukkan email Anda!",
        position: "top",
        visibilityTime: 2500,
      });
      return;
    }

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

    setIsSubmitting(true);

    try {
      // 2. MENGGUNAKAN TEMPLATE LITERAL BASE_URL SINKRON KE CONFIG
      const response = await fetch(`${BASE_URL}/forgot-password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const json = await response.json();

      if (json.success) {
        setCountdown(60);

        Toast.show({
          type: "success",
          text1: "Sukses",
          text2: json.message,
          position: "top",
          visibilityTime: 2500,
        });

        // Beri jeda 1.8 detik agar animasi toast sukses selesai sebelum balik ke Login
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1800);
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
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Terjadi kesalahan jaringan atau server PHP mati!",
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isSubmitting || countdown > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Masukkan email yang terdaftar untuk menerima link pembuatan password
          baru.
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isButtonDisabled}
        />

        <TouchableOpacity
          style={[
            styles.resetButton,
            isButtonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleResetPassword}
          disabled={isButtonDisabled}
        >
          <Text style={styles.resetButtonText}>
            {isSubmitting
              ? "Mengirim..."
              : countdown > 0
                ? `Coba Lagi dalam ${countdown}s`
                : "Kirim Instruksi"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.backButtonText}>Kembali ke Login</Text>
        </TouchableOpacity>
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
  header: {
    alignItems: "center",
    marginBottom: 40,
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
    textAlign: "center",
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
  resetButton: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#93C5FD",
  },
  backButton: {
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
});

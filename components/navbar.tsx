import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface NavbarProps {
  onOpenSidebar: () => void;
  userData: { username: string; email: string } | null;
  profileImage: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSidebar,
  userData,
  profileImage,
}) => {
  // 💡 AMBIL WARNA TEMA REAL-TIME
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity style={styles.navButton} onPress={onOpenSidebar}>
        <Ionicons name="menu" size={26} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.navbarTitle, { color: colors.text }]}>Ambativasi</Text>

      <TouchableOpacity style={styles.profileAvatar}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.avatarImageNavbar}
          />
        ) : (
          <Text style={styles.avatarText}>
            {userData?.username
              ? userData.username.charAt(0).toUpperCase()
              : "U"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  navButton: { padding: 4, width: 40 },
  navbarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  avatarImageNavbar: {
    width: "100%",
    height: "100%",
  },
});
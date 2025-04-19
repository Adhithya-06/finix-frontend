import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList, Switch } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ImportsSettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(null); // Start as null
  const [importedFiles, setImportedFiles] = useState([]);

  // Load saved toggle state from AsyncStorage on mount
  useEffect(() => {
    const loadNotificationSetting = async () => {
      try {
        const savedSetting = await AsyncStorage.getItem("notificationsEnabled");
        if (savedSetting !== null) {
          setNotificationsEnabled(JSON.parse(savedSetting));
        } else {
          setNotificationsEnabled(false); // Default if not set
          await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(false));
        }
      } catch (error) {
        console.error("Failed to load notification setting:", error);
        setNotificationsEnabled(false); // Fallback
      }
    };

    loadNotificationSetting();
  }, []);

  // Handle toggle switch
  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    try {
      await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(newValue));
    } catch (error) {
      console.error("Failed to save notification setting:", error);
    }
  };

  const handleImportStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/csv"],
      });

      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0].uri;
      const name = result.assets[0].name;

      const newFile = { uri, name };
      const updatedFiles = [...importedFiles, newFile];
      setImportedFiles(updatedFiles);

      Alert.alert("Success", "Bank statement imported successfully!");
    } catch (error) {
      console.error("Error importing statement:", error);
    }
  };

  const handleOpenFile = async (uri) => {
    try {
      await WebBrowser.openBrowserAsync(uri);
    } catch (e) {
      Alert.alert("Error", "Could not open file.");
    }
  };

  // Show loading message until toggle state is loaded
  if (notificationsEnabled === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📁 Import & Settings</Text>

      {/* 🔔 Notification Toggle */}
      <View style={styles.settingContainer}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>🔔 Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#ccc", true: "#2ECC71" }}
            thumbColor={notificationsEnabled ? "#fff" : "#888"}
          />
        </View>
      </View>

      {/* 📥 Import Bank Statements */}
      <View style={styles.settingContainer}>
        <Text style={styles.label}>📥 Import Bank Statement</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImportStatement}>
          <Text style={styles.importButtonText}>Import Statement</Text>
        </TouchableOpacity>

        {importedFiles.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 10 }]}>📂 Imported Files:</Text>
            <FlatList
              data={importedFiles}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={{ marginTop: 5 }}>
                  <TouchableOpacity onPress={() => handleOpenFile(item.uri)}>
                    <Text style={{ color: "lightgreen", textDecorationLine: "underline" }}>{item.name}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
};

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#8E241F" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "white" },
  settingContainer: {
    marginBottom: 150,
    padding: 15,
    backgroundColor: "#AE1C1A",
    borderRadius: 10,
    alignItems: "center",
  },
  label: { color: "white", fontSize: 16, fontWeight: "bold" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  importButton: {
    backgroundColor: "#2ECC71",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  importButtonText: { color: "white", fontWeight: "bold" },
});

export default ImportsSettingsScreen;










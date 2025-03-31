import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

// 🆕 Helper to check toggle and show notifications
const notifyIfEnabled = async ({ type = 'info', text1, text2, push = false, pushContent = {} }) => {
  try {
    const enabled = await AsyncStorage.getItem("notificationsEnabled");
    if (JSON.parse(enabled)) {
      Toast.show({ type, text1, text2 });

      if (push && pushContent?.title && pushContent?.body) {
        await Notifications.scheduleNotificationAsync({
          content: {
            ...pushContent,
            sound: "default",
          },
          trigger: null,
        });
      }
    }
  } catch (error) {
    console.error("Notification toggle check failed:", error);
  }
};

const SmartBudgetingScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");
  const [limits, setLimits] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [categorySpending, setCategorySpending] = useState({
    Food: 0,
    Transport: 0,
    Entertainment: 0,
  });
  const [goal, setGoal] = useState({
    description: "",
    targetAmount: 0,
    savedAmount: 0,
  });

  useEffect(() => {
    const spending = { Food: 0, Transport: 0, Entertainment: 0 };

    transactions.forEach((transaction) => {
      if (spending[transaction.category] !== undefined) {
        spending[transaction.category] += transaction.amount;
      }
    });

    setCategorySpending(spending);

    Object.keys(spending).forEach((category) => {
      if (limits[category] && spending[category] > limits[category]) {
        notifyIfEnabled({
          type: 'error',
          text1: `⚠️ Limit Exceeded: ${category}`,
          text2: `Spent: £${spending[category]} / Limit: £${limits[category]}`,
          push: true,
          pushContent: {
            title: "⚠️ Spending Alert!",
            body: `You have exceeded the limit for ${category}. Limit: £${limits[category]}, Spent: £${spending[category]}`,
          },
        });
      }
    });
  }, [transactions, limits]);

  useEffect(() => {
    const loadLimits = async () => {
      try {
        const storedLimits = await AsyncStorage.getItem("spendingLimits");
        if (storedLimits) {
          setLimits(JSON.parse(storedLimits));
        }

        const storedSpending = await AsyncStorage.getItem("categorySpending");
        if (storedSpending) {
          setCategorySpending(JSON.parse(storedSpending));
        }

        const storedGoal = await AsyncStorage.getItem("userGoal");
        if (storedGoal) {
          setGoal(JSON.parse(storedGoal));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("You need to enable notifications for spending alerts.");
      }
    };

    loadLimits();
    requestPermissions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("http://localhost:8000/transactions");
      if (response.status === 200) {
        setTransactions(response.data);
      } else {
        console.error("Error fetching transactions:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const checkSpendingLimit = async (category, amount) => {
    const updatedSpending = (categorySpending[category] || 0) + amount;

    if (limits[category] > 0 && updatedSpending > limits[category]) {
      await notifyIfEnabled({
        type: 'error',
        text1: "⚠️ Spending Limit Exceeded!",
        text2: `Limit: £${limits[category]}, Spent: £${updatedSpending}`,
        push: true,
        pushContent: {
          title: "⚠️ Overspending Alert",
          body: `You spent £${updatedSpending} in ${category} (limit: £${limits[category]})`
        }
      });
    }

    setCategorySpending((prev) => ({
      ...prev,
      [category]: updatedSpending,
    }));

    AsyncStorage.setItem("categorySpending", JSON.stringify({
      ...categorySpending,
      [category]: updatedSpending,
    }));
  };

  const handleSaveLimit = async () => {
    if (!selectedCategory || !spendingLimit) {
      Alert.alert("Error", "Please select a category and enter a limit.");
      return;
    }

    const updatedLimits = { ...limits, [selectedCategory]: parseFloat(spendingLimit) };
    setLimits(updatedLimits);

    try {
      await AsyncStorage.setItem("spendingLimits", JSON.stringify(updatedLimits));

      setCategorySpending((prev) => ({
        ...prev,
        [selectedCategory]: 0,
      }));
      await AsyncStorage.setItem("categorySpending", JSON.stringify({
        ...categorySpending,
        [selectedCategory]: 0,
      }));

      Alert.alert("Success", `Limit for ${selectedCategory} set to £${spendingLimit}`);
      setSpendingLimit("");
    } catch (error) {
      console.error("Error saving spending limit:", error);
    }
  };

  const deleteLimit = async (category) => {
    try {
      const updatedLimits = { ...limits };
      delete updatedLimits[category];

      setLimits(updatedLimits);
      await AsyncStorage.setItem("spendingLimits", JSON.stringify(updatedLimits));

      Alert.alert("Deleted", `Spending limit for ${category} has been removed.`);
    } catch (error) {
      console.error("Error deleting spending limit:", error);
    }
  };

  const handleSaveGoal = async () => {
    try {
      await AsyncStorage.setItem("userGoal", JSON.stringify(goal));

      if (goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0) {
        await notifyIfEnabled({
          type: 'success',
          text1: '🎉 Goal Achieved!',
          text2: `You've reached your goal: ${goal.description}`
        });
      } else {
        await notifyIfEnabled({
          type: 'info',
          text1: 'Goal Saved',
          text2: `Target: £${goal.targetAmount}, Saved: £${goal.savedAmount}`
        });
      }
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const handleSaveSavings = async () => {
    try {
      const updatedGoal = { ...goal, savedAmount: goal.savedAmount };
      setGoal(updatedGoal);
      await AsyncStorage.setItem("userGoal", JSON.stringify(updatedGoal));

      if (goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0) {
        await notifyIfEnabled({
          type: 'success',
          text1: '🎉 Goal Achieved!',
          text2: `Congratulations! You've saved £${goal.savedAmount} for ${goal.description}`
        });
      } else {
        await notifyIfEnabled({
          type: 'info',
          text1: '💰 Savings Updated',
          text2: `You have saved £${goal.savedAmount} so far.`
        });
      }
    } catch (error) {
      console.error("Error updating savings:", error);
    }
  };

  const handleDeleteGoal = async () => {
    try {
      await AsyncStorage.removeItem("userGoal");
      setGoal({ description: "", targetAmount: 0, savedAmount: 0 });
      Alert.alert("Goal Deleted", "Your goal has been removed.");
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Set Spending Limits</Text>

        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select a category" value="" />
          <Picker.Item label="Food" value="Food" />
          <Picker.Item label="Transport" value="Transport" />
          <Picker.Item label="Entertainment" value="Entertainment" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Enter Spending Limit (£)"
          keyboardType="numeric"
          value={spendingLimit}
          onChangeText={setSpendingLimit}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveLimit}>
          <Text style={styles.saveText}>Save Limit</Text>
        </TouchableOpacity>

        <View style={styles.goalContainer}>
          <Text style={styles.goalTitle}>🎯 Goal Tracking</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Goal Description"
            value={goal.description}
            onChangeText={(text) => setGoal({ ...goal, description: text })}
          />

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Target (£):</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={goal.targetAmount.toString()}
                onChangeText={(text) => setGoal({ ...goal, targetAmount: parseFloat(text) || 0 })}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Saved (£):</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={goal.savedAmount.toString()}
                onChangeText={(text) => setGoal({ ...goal, savedAmount: parseFloat(text) || 0 })}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoal}>
            <Text style={styles.saveText}>Save Goal</Text>
          </TouchableOpacity>

          {goal.description !== "" && (
            <View style={styles.goalDisplay}>
              <View style={styles.goalInfoRow}>
                <Text style={styles.goalText}>Goal: {goal.description}</Text>
                <Text style={styles.goalText}>Target: £{goal.targetAmount}</Text>
                <Text style={styles.goalText}>Saved: £{goal.savedAmount}</Text>

                <TouchableOpacity style={styles.deleteGoalButton} onPress={handleDeleteGoal}>
                  <Text style={styles.deleteGoalText}>Delete Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.limitsContainer}>
          <Text style={styles.limitsTitle}>Your Spending Limits:</Text>

          <View style={[styles.tableHeader, { width: "100%" }]}>
            <Text style={[styles.headerText, { width: "25%" }]}>Category</Text>
            <Text style={[styles.headerText, { width: "25%" }]}>Limit (£)</Text>
            <Text style={[styles.headerText, { width: "25%" }]}>Spent (£)</Text>
            <Text style={[styles.headerText, { width: "25%" }]}>Actions</Text>
          </View>

          {Object.keys(limits).length === 0 ? (
            <Text style={styles.noLimitsText}>No spending limits set.</Text>
          ) : (
            Object.keys(limits).map((category) => (
              <View key={category} style={[styles.limitRow, { width: "100%" }]}>
                <Text style={[styles.columnText, { width: "25%" }]}>{category}</Text>
                <Text style={[styles.columnText, { width: "25%" }]}>{limits[category]}</Text>
                <Text style={[styles.columnText, { width: "25%" }]}>{categorySpending[category] || 0}</Text>

                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteLimit(category)}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// **Styles**
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#8E241F",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  picker: {
    height: 50,
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
    color: "black",
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
  },
  limitsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",  // ✅ Center align everything
    paddingVertical: 10,
    backgroundColor: "#721E5E",
    paddingHorizontal: 5, 
    borderRadius: 5,
    width: "100%",
},

headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    width: "25%", // ✅ Force equal width for each column
    paddingHorizontal: 5, // ✅ Add small padding
},

  limitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#721E5E",
  },
  limitText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 2,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "center",  // ✅ Ensures even spacing
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderRadius: 5,
    marginVertical: 5,
   
},


deleteButton: {
    backgroundColor: "#E74C3C",
    padding: 8,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    width: 40, 
},
deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
},
columnText: {
    fontSize: 16,
    color: "#333",
    textAlign: "left",
    width: "25%", // ✅ Match the same width as header
    paddingHorizontal: 5, // ✅ Keep spacing uniform
},

noLimitsText: {
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
    marginVertical: 10,
},
goalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
},
goalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#721E5E",
    marginBottom: 10,
},
goalDisplay: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
},
goalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",  // ✅ Align in a row
    width: "100%",
},
deleteGoalButton: {
    backgroundColor: "#E74C3C",  // Red color for Delete Button
    paddingVertical: 10,  // ✅ Increased padding
    paddingHorizontal: 15, // ✅ Increased horizontal padding
    borderRadius: 5,  // ✅ Sharp edges (not too rounded)
    alignItems: "center",
    justifyContent: "center",
},
deleteGoalText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14, // ✅ Increased text size
},
goalText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 3,
},
savedGoalBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
},
savedGoalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#721E5E",
    marginBottom: 5,
},


  
});

export default SmartBudgetingScreen;


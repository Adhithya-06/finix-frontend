import React, { useState , useEffect} from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { PDFDocument } from "pdf-lib";
import Papa from "papaparse";
import moment from "moment";
import axios from "axios"; // Import axios to send API requests




const TransactionsScreen = () => {
  const [loggedInEmail, setLoggedInEmail] = useState(null); //ADDED

  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1); // Months are 0-indexed in JS
  const [selectedDay, setSelectedDay] = useState(moment().date());
  const [category, setCategory] = useState("Default");

  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState(""); //  Stores edited date
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState(""); // Stores selected category for filtering
  const [customCategory, setCustomCategory] = useState(""); // Stores manually entered category

  

  const formatSelectedDate = () => {
    return `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
  };
  
  
  //  Load Transactions from AsyncStorage when the screen opens
  useEffect(() => {
    const loadEmailAndTransactions = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem("user_email");
        if (storedEmail) {
          setLoggedInEmail(storedEmail);
          await fetchTransactions(storedEmail); // ✅ now fetches based on email
        } else {
          Alert.alert("Error", "No logged-in email found.");
        }
      } catch (error) {
        console.error("❌ Error loading email or transactions:", error);
      }
    };
  
    loadEmailAndTransactions();
  }, []);  //ADDED
  
  
  
  

  // Delete a transaction
  const deleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(`https://finix-backend.onrender.com/delete_transaction/${transactionId}`, { 
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions(transactions.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };


  const fetchTransactions = async (email) => {
    try {
      const response = await axios.get(`https://finix-backend.onrender.com/transactions?email=${email}`);
      setTransactions(response.data);
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
    }
  };   //ADDED
  


//  Now update useEffect() to fetch transactions when the page loads
useEffect(() => {
  console.log("📊 Transactions updated:", transactions);
}, [transactions]); // ✅ This logs transactions every time they change
 // ✅ Re-fetch whenever transactions change


  // Edit a transaction
  const editTransaction = (index) => {
    const transactionToEdit = transactions[index];
    setEditIndex(index);
    setEditDate(transactionToEdit.date);
    setEditCategory(transactionToEdit.category);
    setEditAmount(transactionToEdit.amount.toString());
  };

  const saveTransaction = async () => {
    if (editIndex === null) {
      console.log("❌ No transaction is being edited.");
      return;
    }
  
    const updatedTransaction = {
      id: transactions[editIndex].id, // ✅ Ensure the correct transaction ID is used
      date: editDate,
      category: editCategory,
      amount: parseFloat(editAmount),
    };
  
    console.log("📝 Attempting to save transaction:", updatedTransaction);
  
    try {
      const response = await fetch(`https://finix-backend.onrender.com/update_transaction/${updatedTransaction.id}`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });

      if (!response.ok) throw new Error(`Failed to update transaction`);

      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );

      Alert.alert("Success", "Transaction Updated Successfully!");
    } catch (error) {
      console.error("Error saving transaction:", error);
    }

    setEditIndex(null);
  };
  
  
  

  const handleSubmit = async () => {
    if (!amount || (category === "Default" && !customCategory)) {
      Alert.alert("Error", "Please enter an amount and select a category.");
      return;
    }
    
  
    const finalCategory = category === "Other" ? customCategory : category; // Use custom category if "Other" is selected
  
    const newTransaction = {
      date: formatSelectedDate(),
      category: finalCategory, // Save either selected category or manually entered category
      amount: parseFloat(amount),
      user_email: loggedInEmail, 
      
    };
    console.log("🧾 Submitting Transaction:", newTransaction);

    try {
      const response = await fetch("https://finix-backend.onrender.com/add_transaction", { 

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTransaction),
      });
  
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }
  
      fetchTransactions(); // Refresh transactions after adding
      Alert.alert("Success", "Transaction Submitted Successfully!");
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  
    // Clear inputs
    setCategory("");
    setCustomCategory(""); // Clear custom category input
    setAmount("");
  };
  
  

   

  // Return the UI **(Now inside the component)**
  console.log("Rendering Date Pickers:", { selectedYear, selectedMonth, selectedDay });
  return (
    <ScrollView 
    contentContainerStyle={{ flexGrow: 1 }} 
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>
      <View style={styles.datePickerContainer}>
  <Text style={styles.label}></Text>

  <View style={{ flexDirection: "row" }}>
  <Picker selectedValue={selectedYear || moment().year()} onValueChange={(val) => setSelectedYear(val)} style={styles.picker}>
    {[...Array(10)].map((_, i) => {
      const year = moment().year() - i;
      return <Picker.Item key={year} label={year.toString()} value={year} />;
    })}
  </Picker>

  <Picker selectedValue={selectedMonth || (moment().month() + 1)} onValueChange={(val) => setSelectedMonth(val)} style={styles.picker}>
    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
      <Picker.Item key={month} label={month.toString()} value={month} />
    ))}
  </Picker>

  <Picker selectedValue={selectedDay || moment().date()} onValueChange={(val) => setSelectedDay(val)} style={styles.picker}>
    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
      <Picker.Item key={day} label={day.toString()} value={day} />
    ))}
  </Picker>
</View>

  
  {/* Show Selected Date */}
  <Text style={styles.dateText}>Selected Date: {formatSelectedDate()}</Text>
</View>



<Picker
  selectedValue={category || "Default"}
  onValueChange={(itemValue) => {
    setCategory(itemValue);
    if (itemValue !== "Other") {
      setCustomCategory("");
    }
  }}
  style={[styles.picker, styles.categoryPicker]}
>
  <Picker.Item label="Select a category" value="Default" />
  <Picker.Item label="Food" value="Food" />
  <Picker.Item label="Transport" value="Transport" />
  <Picker.Item label="Entertainment" value="Entertainment" />
  <Picker.Item label="Other" value="Other" />
</Picker>


{/* Show TextInput ONLY if "Other" is selected */}
{category === "Other" && (
  <TextInput
    style={styles.input}
    placeholder="Enter custom category"
    value={customCategory}
    onChangeText={setCustomCategory}
  />
)}


    

      {/*  Amount Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter Amount (£)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>Submit Transaction</Text>
      </TouchableOpacity>

      {/* Transactions Table */}
      {transactions.length > 0 && (
        <View style={styles.tableContainer}>
          <Text style={styles.transactionTitle}>Transactions List:</Text>
      
          <Picker
  selectedValue={selectedFilterCategory}
  onValueChange={(itemValue) => setSelectedFilterCategory(itemValue)}
  style={[styles.picker, styles.categoryPicker]}
>
  <Picker.Item label="All Categories" value="" />
  <Picker.Item label="Food" value="Food" />
  <Picker.Item label="Transport" value="Transport" />
  <Picker.Item label="Entertainment" value="Entertainment" />
  <Picker.Item label="Other" value="Other" /> {/* NEW ADDITION */}
</Picker>



          <FlatList
  data={selectedFilterCategory 
    ? transactions.filter(t => 
        selectedFilterCategory === "Other" 
          ? !["Food", "Transport", "Entertainment"].includes(t.category) // Show non-default categories
          : t.category === selectedFilterCategory
      ) 
    : transactions}
  
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.tableRow}>
                {editIndex === index ? (
                  <>
                    {/*  Editable Inputs */}
                    <View style={{ flexDirection: "row" }}>
  <Picker selectedValue={selectedYear} onValueChange={(val) => setSelectedYear(val)} style={styles.picker}>
    {[...Array(10)].map((_, i) => {
      const year = moment().year() - i;
      return <Picker.Item key={year} label={year.toString()} value={year} />;
    })}
  </Picker>
  <Picker selectedValue={selectedMonth} onValueChange={(val) => setSelectedMonth(val)} style={styles.picker}>
    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
      <Picker.Item key={month} label={month.toString()} value={month} />
    ))}
  </Picker>
  <Picker selectedValue={selectedDay} onValueChange={(val) => setSelectedDay(val)} style={styles.picker}>
    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
      <Picker.Item key={day} label={day.toString()} value={day} />
    ))}
  </Picker>
</View>

                    <TextInput 
                    style={styles.editInput} 
                    value={editCategory} 
                    onChangeText={setEditCategory} 
                    />
                    <TextInput 
                    style={styles.editInput} 
                    value={editAmount}
                    onChangeText={setEditAmount} 
                    keyboardType="numeric" 
                    />

                    {/* Save Button */}
                    <TouchableOpacity onPress={saveTransaction} style={styles.saveButton}>
                      <Text style={styles.saveText}>✔️</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.rowCell}>{item.date}</Text>
                    <Text style={styles.rowCell}>{item.category}</Text>
                    <Text style={styles.rowCell}>£{item.amount.toFixed(2)}</Text>

                    {/* Edit Button */}
                    <TouchableOpacity onPress={() => editTransaction(index)} style={styles.editButton}>
                      <Text style={styles.editText}>✏️</Text>
                    </TouchableOpacity>


                    {/* Delete Button */}
                    <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>🗑️</Text>
                    </TouchableOpacity>

              

                  </>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
    </ScrollView>
  );
};

// Export the component at the bottom


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#8E241F",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  dateSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dateButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "white",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  
  rowCell: {
    flex: 1,  // Ensures each column has equal width
    textAlign: "center",
    color: "black",
  },
  
  transactionsList: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 20,
  },
  pickerContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: "white",
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  importButton: {
    backgroundColor: "#721E5E",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  tableContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#721E5E",
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: "center",
    color: "black",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#721E5E",
  },
  deleteButton: {
    padding: 5,
    backgroundColor: "#E74C3C",  // Red background for delete
    borderRadius: 5,
    marginLeft: 5,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  editButton: {
    padding: 5,
    backgroundColor: "#F39C12", // Orange color for edit
    borderRadius: 5,
    marginLeft: 5,
  },
  editText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    padding: 5,
    backgroundColor: "#27AE60", // Green color for save
    borderRadius: 5,
    marginLeft: 5,
  },
  saveText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  editInput: {
    backgroundColor: "white",  // White background
    color: "black",  //  Ensure text is black (visible)
    borderWidth: 1,  //  Add a border for visibility
    borderColor: "#ccc",  //  Light border for better contrast
    padding: 10,
    borderRadius: 5,
    width: "40%",  // Adjust width so it doesn’t take up too much space
    textAlign: "center",  // Keep text centered for neat appearance
  },
  datePickerContainer: {
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  
  datePickerButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    width: "60%",
    alignItems: "center",
  },
  
  datePickerText: {
    fontSize: 16,
    color: "#721E5E",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    color: "#fff",
    width: "100%", 
  },
  picker: {
    height: 50,
    width: 120,  //  Increased width for visibility
    color: "black",  //  Ensure text is visible
    backgroundColor: "#fff",  //  Make dropdown visible
    borderRadius: 5,
    borderWidth: 1,  // Add a border for visibility
    borderColor: "#ccc",
  },
  categoryPicker: {
    backgroundColor: "#fff", // White background
    color: "black", //  Black text
    borderRadius: 5, //  Rounded corners
    borderWidth: 1, //  Add border
    borderColor: "#ccc", //  Light border
    paddingHorizontal: 10, //  Padding
    height: 50, // Set height
    width: "100%",
    marginBottom: 5,
  },
  
  
});

export default TransactionsScreen;
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);

  //  Load Transactions from AsyncStorage (persistent storage)
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const storedTransactions = await AsyncStorage.getItem("transactions");
        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    };
    loadTransactions();
  }, []);

  //  Save Transactions to AsyncStorage whenever they change
  useEffect(() => {
    const saveTransactions = async () => {
      try {
        await AsyncStorage.setItem("transactions", JSON.stringify(transactions));
      } catch (error) {
        console.error("Error saving transactions:", error);
      }
    };
    saveTransactions();
  }, [transactions]);

  // Function to add a new transaction
  const addTransaction = (newTransaction) => {
    setTransactions((prevTransactions) => [...prevTransactions, newTransaction]);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};


import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker for drop-down
import { PieChart, ProgressChart, LineChart } from 'react-native-chart-kit';
import { TransactionContext } from "../context/TransactionContext";
import { useContext } from "react";
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import { useFocusEffect } from '@react-navigation/native'; 
import { TouchableOpacity } from 'react-native';


const screenWidth = Dimensions.get('window').width;
const categoryHierarchy = {
    Food: ["Groceries", "Restaurants", "Cafes"],
    Transport: ["Fuel", "Public Transport", "Taxi"],
    Entertainment: ["Movies", "Concerts", "Games"]
};


const DashboardScreen = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('Monthly'); // Default: Monthly
    
    const handleTouch = (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setTooltip({ visible: true, x: locationX, y: locationY, category: "Category Clicked" });
    
        setTimeout(() => setTooltip({ visible: false, x: 0, y: 0, category: "" }), 2000); // Hide tooltip after 2 sec
    };
    
    const calculateSpendingData = () => {
        let now = new Date();
        let weeklyTotal = 0, monthlyTotal = 0, yearlyTotal = 0;
    
        // Calculate start and end of current week
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);
    
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
    
        // Start of month and year
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
    
        transactions.forEach((transaction) => {
            const txDate = new Date(transaction.date);
    
            if (txDate >= monday && txDate <= sunday) weeklyTotal += transaction.amount;
            if (txDate >= monthStart) monthlyTotal += transaction.amount;
            if (txDate >= yearStart) yearlyTotal += transaction.amount;
        });
    
        return {
            Weekly: parseFloat(weeklyTotal.toFixed(2)),
            Monthly: parseFloat(monthlyTotal.toFixed(2)),
            Yearly: parseFloat(yearlyTotal.toFixed(2)),
        };
    };
    

const [transactions, setTransactions] = useState([]); // Store transactions from API
const [selectedCategory, setSelectedCategory] = useState(null); // Tracks selected slice
const [subcategories, setSubcategories] = useState({}); // Stores drill-down subcategories
const [drillDownCategory, setDrillDownCategory] = useState(null); // Tracks which category is expanded
const [modalVisible, setModalVisible] = useState(false);
const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, category: "" });
// ✅ Fetch Goal Data from AsyncStorage
const [goal, setGoal] = useState({ description: "", targetAmount: 0, savedAmount: 0 });




const fetchGoal = async () => {
    try {
        const storedGoal = await AsyncStorage.getItem("userGoal");
        if (storedGoal) {
            setGoal(JSON.parse(storedGoal));
        }
    } catch (error) {
        console.error("Error fetching goal:", error);
    }
};

// ✅ Ensure Goal Updates When Dashboard Opens
useFocusEffect(
    React.useCallback(() => {
        fetchTransactions(); // Fetch transactions
        fetchGoal(); // Fetch latest goal progress
    }, [])
);



const fetchTransactions = async () => {
    try {
        const response = await axios.get("https://finix-app.onrender.com/transactions");
        setTransactions(response.data); //  Update state with latest transactions
    } catch (error) {
        console.error("Error fetching transactions:", error);
    }
};

//  Fetch transactions when Dashboard loads
useEffect(() => {
    fetchTransactions();
    
    // Fetch Goal Data from AsyncStorage
    const loadGoalData = async () => {
        try {
            const storedGoal = await AsyncStorage.getItem("userGoal");
            if (storedGoal) {
                setGoal(JSON.parse(storedGoal));
            }
        } catch (error) {
            console.error("Error fetching goal data:", error);
        }
    };

    loadGoalData();
}, []);



const spendingData = calculateSpendingData(); // Dynamic spending data

    // Updated Function to generate practical summary text
    const getSummaryText = () => {
        const amount = spendingData[selectedPeriod];

        if (selectedPeriod === "Weekly") {
            if (amount < 300) return "You're managing your weekly budget well! 🎯";
            if (amount < 1000) return "Watch your expenses this week! 💰";
            return "Careful! You're spending a lot this week. ⚠️";
        }

        if (selectedPeriod === "Monthly") {
            if (amount < 1500) return "You're on track with your monthly spending! 👍";
            if (amount < 5000) return "Your expenses are moderate. Keep tracking! 👀";
            return "You're nearing your monthly limit. Be mindful! 🚨";
        }

        if (selectedPeriod === "Yearly") {
            if (amount < 12000) return "Your yearly spending is balanced! ✅";
            if (amount < 30000) return "You're spending consistently. Keep tracking. 📊";
            return "Your expenses are high this year. Consider adjusting! ⚠️";
        }
    };

    // Sample data for Pie Chart (Spending by Category)
   //  Dynamically calculate spending per category
 // Dynamically group subcategories under main categories
const categoryTotals = transactions.reduce((acc, transaction) => {
    // Find parent category or keep it as is if no parent exists
    let parentCategory = Object.keys(categoryHierarchy).find(parent =>
        categoryHierarchy[parent].includes(transaction.category)
    ) || transaction.category;

    if (!acc[parentCategory]) {
        acc[parentCategory] = { total: 0, subcategories: {} };
    }

    // Add transaction to parent category
    acc[parentCategory].total += transaction.amount;

    // Add to subcategories
    if (parentCategory !== transaction.category) {
        if (!acc[parentCategory].subcategories[transaction.category]) {
            acc[parentCategory].subcategories[transaction.category] = 0;
        }
        acc[parentCategory].subcategories[transaction.category] += transaction.amount;
    }

    return acc;
}, {});



// Define subcategories for drill-down
const drillDownData = {
    Food: { Restaurants: 60, Groceries: 40 },
    Transport: { Fuel: 50, PublicTransport: 50 },
    Entertainment: { Movies: 40, Concerts: 60 }
};


const categoryColors = ["#381E72", "#6A721E", "#721E5E", "#E74C3C", "#2ECC71" , "#F39C12", "#9B59B6", "#3498DB", "#1ABC9C", "#D35400"]; // Default colors

const pieData = drillDownCategory
    ? Object.keys(drillDownData[drillDownCategory]).map((sub, index) => ({
        name: sub,
        amount: drillDownData[drillDownCategory][sub],
        color: categoryColors[index % categoryColors.length], 
        legendFontColor: "#fff",
        legendFontSize: 12,
    }))
    : Object.keys(categoryTotals).map((category, index) => ({
        name: category,
        amount: parseFloat(categoryTotals[category].total.toFixed(2)),
        color: categoryColors[index % categoryColors.length],
        legendFontColor: "#fff",
        legendFontSize: 12,
    }))
    





    const handlePiePress = (index) => {
        const clickedCategory = pieData[index].name;
        console.log("Category Clicked:", clickedCategory); // Debugging log
        setSelectedCategory(clickedCategory);
        setModalVisible(true);
    };
    

    



    // Sample data for Goal Progress Chart (Donut Chart)
    const progressData = {
        labels: ["Goal"],
        data: [goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0], // ✅ Dynamic Progress
    };
    

    const getKpiChartData = () => {
        // Group by week number or month
        const groupedData = {};
    
        transactions.forEach((transaction) => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`; // e.g., "3-2025"
    
            if (!groupedData[monthYear]) {
                groupedData[monthYear] = 0;
            }
            groupedData[monthYear] += transaction.amount;
        });
    
        const sortedKeys = Object.keys(groupedData).sort((a, b) => {
            const [aMonth, aYear] = a.split('-').map(Number);
            const [bMonth, bYear] = b.split('-').map(Number);
            return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
        });
    
        return {
            labels: sortedKeys.map(key => {
                const [month] = key.split('-');
                return new Date(0, month - 1).toLocaleString('default', { month: 'short' }); // "Jan", "Feb" etc.
            }),
            datasets: [{
                data: sortedKeys.map(key => parseFloat(groupedData[key].toFixed(2))),
                color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                strokeWidth: 2
            }]
        };
    };
    
    const kpiData = getKpiChartData(); // Replace static kpiData
    

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Total Spending + Drop-down Menu */}
            <View style={styles.totalSpendingContainer}>
                <Text style={styles.totalSpendingText}>£{spendingData[selectedPeriod]}</Text>
                <Text style={styles.totalSpendingTitle}>Total Money Spent</Text>

                {/*  Drop-down Menu for Period Selection */}
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selectedPeriod}
                        onValueChange={(itemValue) => setSelectedPeriod(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Weekly" value="Weekly" />
                        <Picker.Item label="Monthly" value="Monthly" />
                        <Picker.Item label="Yearly" value="Yearly" />
                    </Picker>
                </View>
            </View>

            {/* Charts in a Row Format */}
            <View style={styles.chartsRow}>
                {/* Pie Chart (Spending by Category) */}
  
                <View style={styles.chartBox}>
    <Text style={styles.chartTitle}>
        {drillDownCategory ? `Breakdown of ${drillDownCategory}` : "Spending by Category"}
    </Text>

    {/* Back button to go to main categories */}
    {drillDownCategory && (
        <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setDrillDownCategory(null)}
        >
            <Text style={styles.backButtonText}>← Back to Categories</Text>
        </TouchableOpacity>
    )}

    {/* Touchable Pie Chart */}
    <View style={{ position: 'relative' }}>
    <TouchableOpacity onPress={handleTouch} activeOpacity={1}>
        <PieChart
            data={pieData}
            width={screenWidth * 0.32}  
            height={180}
            chartConfig={chartConfig}
            accessor={"amount"}
            backgroundColor={"transparent"}  
            paddingLeft={"15"}
            absolute
            onDataPointClick={({ index }) => handlePiePress(index)}  
        />
    </TouchableOpacity>
</View>
</View>


                {/* Goal Progress (Donut Chart with Colors) */}
                <View style={styles.chartBox}>
                    <Text style={styles.chartTitle}>Goal Progress</Text>
                    <ProgressChart
                        data={progressData}
                        width={screenWidth * 0.3}  
                        height={180}
                        strokeWidth={16}
                        radius={50}
                        chartConfig={goalChartConfig} 
                        hideLegend={false}
                    />
                     {/* ✅ Display Goal Details Below the Chart */}
   
                </View>

                {/* KPI Trend (Line Chart) */}
                <View style={styles.chartBox}>
                    <Text style={styles.chartTitle}>KPI Trend</Text>
                    <LineChart
                        data={kpiData}
                        width={screenWidth * 0.27}  
                        height={180}
                        chartConfig={chartConfig}
                        bezier
                    />
                </View>
            </View>

            {/* Quick Summary Text (Moved to Bottom) */}
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>{getSummaryText()}</Text>
            </View>

        </ScrollView>
        
    );
    
    
};

// **General Chart Configurations (for Pie & Line Charts)**
const chartConfig = {
    backgroundGradientFrom: "#8E241F",
    backgroundGradientTo: "#8E241F",
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Fixed template literal syntax
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    decimalPlaces: 2,
};

// **Goal Progress Chart Configuration (Custom Colors for Donut Chart)**
const goalChartConfig = {
    backgroundGradientFrom: "#8E241F",
    backgroundGradientTo: "#8E241F",
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,  // Fixed template literal syntax
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 16, 
    radius: 55,
    backgroundColor: "transparent",
    useShadowColorFromDataset: false,
};

// **Styles**
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
        backgroundColor: '#8E241F'
    },
    backButton: {
        marginTop: 10,
        padding: 8,
        backgroundColor: "#fff",
        borderRadius: 5,
        alignSelf: "center",
    },
    backButtonText: {
        color: "#721E5E",
        fontWeight: "bold",
    },
    
    totalSpendingContainer: {
        backgroundColor: '#AE1C1A',
        padding: 25,
        borderRadius: 10,
        marginBottom: 100,
        width: '90%',
        alignItems: 'center',
    },
    totalSpendingText: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#fff',
    },
    totalSpendingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 5,
        width: '60%',
        marginTop: 10,
    },
    picker: {
        height: 40,
        color: '#721E5E',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    summaryContainer: {
        marginTop: 80, 
        marginBottom: 50,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#721E5E',
    },
    chartsRow: {
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
    },
    chartBox: {
        backgroundColor: '#AE1C1A',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        width: '30%', 
    },
    goalInfo: {
        marginTop: 10,
        padding: 10,
        backgroundColor: "#AE1C1A",
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
    },
    goalText: {
        fontSize: 16,
        color: "#333",
        marginVertical: 3,
    },
    
    
});

export default DashboardScreen;




















  







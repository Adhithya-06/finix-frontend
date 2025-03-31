import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Button } from 'react-native-paper';
import axios from 'axios';

const InsightsScreen = ({ navigation }) => {
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await axios.get("http://localhost:8000/ai/insights");
                setAiInsights(response.data);
            } catch (err) {
                setError('Failed to load insights. Please try again.');
                console.error("Error fetching insights:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    const formatDateRange = (range) => {
        const [start, end] = range.split(" to ");
        const format = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return `${format(start)} - ${format(end)}`;
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>📈 AI-Powered Financial Insights</Text>

            {loading ? (
                <ActivityIndicator size="large" color="white" />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : aiInsights ? (
                <>
                    
                       

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.message}>🏆 <Text style={{ fontWeight: "bold" }}>Top Spending Category:</Text> {aiInsights.highest_spending_category}</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.message}>💡 <Text style={{ fontWeight: "bold" }}>Advice:</Text> {aiInsights.advice}</Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.message}>📊 <Text style={{ fontWeight: "bold" }}>Next 4 Weeks Prediction:</Text></Text>
                            <Text style={styles.message}>
                                💰 Total: £{Object.values(aiInsights.predicted_total_spending).reduce((acc, val) => acc + val, 0).toFixed(2)}
                            </Text>
                            {Object.entries(aiInsights.predicted_total_spending).map(([range, amount], idx) => (
                                <Text key={idx} style={styles.message}>
                                    • {formatDateRange(range)}: £{amount.toFixed(2)}
                                </Text>
                            ))}
                        </Card.Content>
                    </Card>
                </>
            ) : (
                <Text style={styles.message}>No insights available.</Text>
            )}

            <Button mode="contained" onPress={() => navigation.navigate('Dashboard')} style={styles.button}>
                Go to Dashboard
            </Button>
            <Button mode="contained" onPress={() => navigation.navigate('Transactions')} style={styles.button}>
                View Transactions
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#8E241F' },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: 'white'
    },
    card: { marginBottom: 15, padding: 10, backgroundColor: 'white' },
    message: { fontSize: 16, color: '#333' },
    button: { marginTop: 10 },
    errorText: { color: 'red', textAlign: 'center', fontSize: 16, marginBottom: 10 },
});

export default InsightsScreen;





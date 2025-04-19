import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

//  Import TransactionProvider from TransactionContext
import { TransactionProvider } from './context/TransactionContext';
import { ThemeProvider } from "./context/ThemeContext"; 
// Import Screens
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import InsightsScreen from './screens/InsightsScreen';
import SmartBudgetingScreen from './screens/SmartBudgetingScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen'; // Login & Signup Screen
import Toast from 'react-native-toast-message';

// Create Drawer Navigator
const Drawer = createDrawerNavigator();

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setTimeout(() => {
        setLoading(false); //  Hide Splash Screen
        setUser(authenticatedUser); //  Set user state
      }, 2000); //  Show splash for 2 seconds
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth).catch((error) => alert(error.message));
  };

  //  **Splash Screen**
  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('./assets/finix-logo.png')} style={styles.splashImage} />
        <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    //  Wrap the whole app with TransactionProvider
    <ThemeProvider>
    <TransactionProvider>
      <NavigationContainer>
        {user ? (
          <Drawer.Navigator
            screenOptions={({ route }) => ({
              drawerIcon: ({ color, size }) => {
                let iconName;
                if (route.name === 'Dashboard') {
                  iconName = 'home';
                } else if (route.name === 'Transactions') {
                  iconName = 'receipt';
                } else if (route.name === 'Insights') {
                  iconName = 'bar-chart';
                } else if (route.name === 'Smart Budgeting') { 
                  iconName = 'wallet';
                } else if (route.name === 'Settings') { 
                  iconName = 'settings';   // ✅ Newly Added Icon   
                } else if (route.name === 'Sign Out') {
                  iconName = 'log-out';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              drawerActiveTintColor: 'tomato',
              drawerInactiveTintColor: 'black',
              drawerStyle: { backgroundColor: 'pink' },
              sceneContainerStyle: { backgroundColor: 'pink' },
              headerRight: () => (
                <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
                  <Ionicons name="log-out" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          >
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="Transactions" component={TransactionsScreen} />
            <Drawer.Screen name="Insights" component={InsightsScreen} />
            <Drawer.Screen name="Smart Budgeting" component={SmartBudgetingScreen} />
            <Drawer.Screen name="Settings" component={SettingsScreen} /> 
            {/*  Sign Out Button in Hamburger Menu */}
            <Drawer.Screen
              name="Sign Out"
              component={() => (
                <View style={styles.signOutContainer}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Are you sure you want to sign out?</Text>
                  <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              )}
              options={{
                drawerLabel: 'Sign Out',
              }}
            />
          </Drawer.Navigator>
        ) : (
          //  Show Login Screen **AFTER** Splash Screen if user is NOT authenticated
          <AuthScreen />
        )}
      </NavigationContainer>
    </TransactionProvider>
    <Toast />

    </ThemeProvider>
  );
};

//  **Styles**
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  splashImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  logoutButton: {
    marginRight: 15,
  },
  signOutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    marginTop: 20,
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
});

//  Only ONE export default
export default App;


























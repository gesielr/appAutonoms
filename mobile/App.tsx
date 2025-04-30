import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import Navigation from './src/navigation';
import { View, Text } from 'react-native';
// @ts-ignore: ignorando ausência de tipos para NetInfo
import NetInfo from '@react-native-community/netinfo';

// Definição do tema personalizado
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0066CC',
    accent: '#003366',
    background: '#f5f5f5',
  },
};

export default function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      {!isConnected && (
        <View style={{ backgroundColor: '#F44336', padding: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Você está offline
          </Text>
        </View>
      )}
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <Navigation />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

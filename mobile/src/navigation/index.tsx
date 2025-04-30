import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Importação das telas de autenticação
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Importação das telas principais
import HomeScreen from '../screens/app/HomeScreen';
import GuideRequestScreen from '../screens/app/GuideRequestScreen';
import GuideHistoryScreen from '../screens/app/GuideHistoryScreen';
import ProfileScreen from '../screens/app/ProfileScreen';
import GuideDetailsScreen from '../screens/app/GuideDetailsScreen';
import PaymentScreen from '../screens/app/PaymentScreen';
import WelcomeScreen from '../screens/app/WelcomeScreen';

// Definição dos tipos para as pilhas de navegação
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type AppStackParamList = {
  MainTabs: undefined;
  GuideDetails: { guideId: string };
  Payment: { guideId: string };
  Welcome: undefined;
};

type MainTabsParamList = {
  Home: undefined;
  GuideRequest: undefined;
  GuideHistory: undefined;
  Profile: undefined;
};

// Criação das pilhas de navegação
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const MainTabs = createBottomTabNavigator();

// Componente de navegação para as abas principais
function MainTabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'GuideRequest') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'GuideHistory') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <MainTabs.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Início' }} 
      />
      <MainTabs.Screen 
        name="GuideRequest" 
        component={GuideRequestScreen} 
        options={{ title: 'Nova Guia' }} 
      />
      <MainTabs.Screen 
        name="GuideHistory" 
        component={GuideHistoryScreen} 
        options={{ title: 'Histórico' }} 
      />
      <MainTabs.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }} 
      />
    </MainTabs.Navigator>
  );
}

// Componente principal de navegação
export default function Navigation() {
  const { user, loading } = useAuth();
  
  // Se estiver carregando, pode mostrar um splash screen ou loading
  if (loading) {
    return null; // ou um componente de loading
  }

  return (
    <>
      {user ? (
        // Usuário autenticado - mostrar tela de boas-vindas e principais
        <AppStack.Navigator initialRouteName="Welcome">
          <AppStack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <AppStack.Screen 
            name="MainTabs" 
            component={MainTabsNavigator} 
            options={{ headerShown: false }} 
          />
          <AppStack.Screen 
            name="GuideDetails" 
            component={GuideDetailsScreen} 
            options={{ title: 'Detalhes da Guia' }} 
          />
          <AppStack.Screen 
            name="Payment" 
            component={PaymentScreen} 
            options={{ title: 'Pagamento' }} 
          />
        </AppStack.Navigator>
      ) : (
        // Usuário não autenticado - mostrar telas de autenticação
        <AuthStack.Navigator>
          <AuthStack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />
          <AuthStack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Cadastro' }} 
          />
        </AuthStack.Navigator>
      )}
    </>
  );
}

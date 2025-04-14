import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Telas do aplicativo
import HomeScreen from '../screens/app/HomeScreen';
import ProfileScreen from '../screens/app/ProfileScreen';
import GuideListScreen from '../screens/app/GuideListScreen';
import GuideDetailsScreen from '../screens/app/GuideDetailsScreen';
import GuideRequestScreen from '../screens/app/GuideRequestScreen';
import PaymentScreen from '../screens/app/PaymentScreen';

// Definição dos parâmetros para as rotas
export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  GuideList: undefined;
  GuideDetails: { guideId: number };
  GuideRequest: undefined;
  Payment: { guiaId: number };
};

const Stack = createStackNavigator<AppStackParamList>();

const AppNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Início' }} 
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Meu Perfil' }} 
      />
      <Stack.Screen 
        name="GuideList" 
        component={GuideListScreen} 
        options={{ title: 'Minhas Guias' }} 
      />
      <Stack.Screen 
        name="GuideDetails" 
        component={GuideDetailsScreen} 
        options={{ title: 'Detalhes da Guia' }} 
      />
      <Stack.Screen 
        name="GuideRequest" 
        component={GuideRequestScreen} 
        options={{ title: 'Solicitar Guia' }} 
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{ title: 'Pagamento' }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

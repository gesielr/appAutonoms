import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleGetStarted = () => {
    navigation.replace('MainTabs');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Bem-vindo ao app Autônomo INSS!</Text>
          <Text style={styles.subtitle}>
            Obrigado por se cadastrar. Vamos solicitar sua primeira guia?
          </Text>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button mode="contained" onPress={handleGetStarted}>
            Solicitar Guia
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#0066CC',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  actions: {
    justifyContent: 'center',
  },
});

export default WelcomeScreen;

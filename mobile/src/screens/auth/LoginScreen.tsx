import React, { useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaskedTextInput } from 'react-native-mask-text';
import { useAuth } from '../../context/AuthContext';

// Tipo para as rotas de navegação
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const navigation = useNavigation();
  const { signIn } = useAuth();

  // Função para lidar com o login
  const handleLogin = async () => {
    // Validação básica
    if (!cpf || !password) {
      setError('Por favor, preencha todos os campos');
      setSnackbarVisible(true);
      return;
    }

    // Remove formatação do CPF
    const cleanedCpf = cpf.replace(/\D/g, '');
    
    // Validação do CPF
    if (cleanedCpf.length !== 11) {
      setError('CPF inválido');
      setSnackbarVisible(true);
      return;
    }

    try {
      setLoading(true);
      await signIn(cleanedCpf, password);
      // Navegação é tratada pelo contexto de autenticação
    } catch (err) {
      setError('Falha na autenticação. Verifique suas credenciais.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logoapp.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Guias INSS</Text>
            <Text style={styles.subtitle}>Geração automática de guias para contribuintes</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Login</Text>
            
            <TextInput
              label="CPF"
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              render={props => (
                <MaskedTextInput
                  {...props}
                  mask="999.999.999-99"
                  value={cpf}
                  onChangeText={setCpf}
                />
              )}
            />

            <TextInput
              label="Senha"
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              style={styles.button}
              loading={loading}
              disabled={loading}
              onPress={handleLogin}
            >
              Entrar
            </Button>

            <View style={styles.registerContainer}>
              <Text>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerText}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0066CC',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#0066CC',
    fontWeight: 'bold',
  },
});

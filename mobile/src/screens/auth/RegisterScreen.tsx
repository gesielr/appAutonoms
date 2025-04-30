import React, { useState } from 'react';
// @ts-ignore - Ignorando erros de TypeScript nas importações
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { TextInput, Button, Text, Snackbar, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaskedTextInput } from 'react-native-mask-text';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [nitPis, setNitPis] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [category, setCategory] = useState<'INDIVIDUAL' | 'DOMESTICO' | 'FACULTATIVO'>('INDIVIDUAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const { signUp } = useAuth();

  // Função para validar o formulário
  const validateForm = () => {
    if (!name || !email || !cpf || !nitPis || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return false;
    }

    // Validação de email simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email inválido');
      return false;
    }

    // Remove formatação do CPF
    const cleanedCpf = cpf.replace(/\D/g, '');
    
    // Validação do CPF
    if (cleanedCpf.length !== 11) {
      setError('CPF inválido');
      return false;
    }

    // Remove formatação do NIT/PIS
    const cleanedNitPis = nitPis.replace(/\D/g, '');
    
    // Validação do NIT/PIS
    if (cleanedNitPis.length !== 11) {
      setError('NIT/PIS inválido');
      return false;
    }

    // Validação de senha
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    // Validação de confirmação de senha
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    return true;
  };

  // Função para lidar com o cadastro
  const handleRegister = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true);
      return;
    }

    // Remove formatação do CPF e NIT/PIS
    const cleanedCpf = cpf.replace(/\D/g, '');
    const cleanedNitPis = nitPis.replace(/\D/g, '');

    try {
      setLoading(true);
      await signUp({
        name,
        email,
        cpf: cleanedCpf,
        nit_pis: cleanedNitPis,
        category,
        password,
      });
      // Navegação é tratada pelo contexto de autenticação
    } catch (err) {
      setError('Falha no cadastro. Tente novamente.');
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Cadastro</Text>
              
              <TextInput
                label="Nome completo"
                mode="outlined"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                label="E-mail"
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                label="CPF"
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                value={cpf}
                onChangeText={(text) => {
                  // Aplicar máscara manualmente
                  const cleaned = text.replace(/\D/g, '');
                  let formatted = cleaned;
                  
                  if (cleaned.length <= 3) {
                    formatted = cleaned;
                  } else if (cleaned.length <= 6) {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
                  } else if (cleaned.length <= 9) {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
                  } else {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
                  }
                  
                  setCpf(formatted);
                }}
                maxLength={14} // 999.999.999-99 (14 caracteres)
              />

              <TextInput
                label="NIT/PIS"
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                value={nitPis}
                onChangeText={(text) => {
                  // Aplicar máscara manualmente
                  const cleaned = text.replace(/\D/g, '');
                  let formatted = cleaned;
                  
                  if (cleaned.length <= 3) {
                    formatted = cleaned;
                  } else if (cleaned.length <= 8) {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
                  } else if (cleaned.length <= 10) {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8)}`;
                  } else {
                    formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 8)}.${cleaned.slice(8, 10)}-${cleaned.slice(10, 11)}`;
                  }
                  
                  setNitPis(formatted);
                }}
                maxLength={14} // 999.99999.99-9 (14 caracteres)
              />

              <Text style={styles.categoryLabel}>Categoria de Contribuinte</Text>
              <RadioButton.Group onValueChange={(value) => setCategory(value as any)} value={category}>
                <View style={styles.radioOption}>
                  <RadioButton value="INDIVIDUAL" />
                  <Text>Individual (Autônomo)</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="DOMESTICO" />
                  <Text>Empregador Doméstico</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="FACULTATIVO" />
                  <Text>Facultativo</Text>
                </View>
              </RadioButton.Group>

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

              <TextInput
                label="Confirmar senha"
                mode="outlined"
                style={styles.input}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Button
                mode="contained"
                style={styles.button}
                loading={loading}
                disabled={loading}
                onPress={handleRegister}
              >
                Cadastrar
              </Button>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
    padding: 20,
    paddingBottom: 40, // Adiciona espaço extra no final para rolagem
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
  categoryLabel: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#0066CC',
  },
});

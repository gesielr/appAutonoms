import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStoreNative from 'expo-secure-store';
import secureStoreWeb from '../utils/secureStoreWeb';
import api from '../services/api';

// Tipos para o contexto
type User = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  nit_pis: string;
  category: 'INDIVIDUAL' | 'DOMESTICO' | 'FACULTATIVO';
};

type AuthContextData = {
  user: User | null;
  loading: boolean;
  signIn: (cpf: string, password: string) => Promise<void>;
  signUp: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
};

// Criação do contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Hook personalizado para usar o contexto
export function useAuth() {
  return useContext(AuthContext);
}

// Provedor do contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se estamos na plataforma web
  const isWeb = typeof document !== 'undefined';
  // Usar o adaptador web ou o SecureStore nativo dependendo da plataforma
  const SecureStore = isWeb ? secureStoreWeb : SecureStoreNative;

  // Carregar usuário do armazenamento seguro ao iniciar
  useEffect(() => {
    async function loadStoredData() {
      setLoading(true);
      
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await SecureStore.getItemAsync('user_data');
      
      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }
      
      setLoading(false);
    }
    
    loadStoredData();
  }, []);

  // Função de login
  async function signIn(cpf: string, password: string) {
    try {
      const response = await api.post('/auth/login', { cpf, password });
      
      const { token, user: userData } = response.data;
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      throw new Error('Falha na autenticação. Verifique suas credenciais.');
    }
  }

  // Função de cadastro
  async function signUp(userData: Omit<User, 'id'> & { password: string }) {
    try {
      // Converter os nomes dos campos para o formato esperado pelo backend
      const backendData = {
        nome: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        nit_pis: userData.nit_pis,
        categoria: userData.category,
        senha: userData.password
      };
      
      const response = await api.post('/users', backendData);
      
      const { token, user: newUser } = response.data;
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(newUser));
      
      setUser(newUser);
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw new Error('Falha no cadastro. Tente novamente.');
    }
  }

  // Função de logout
  async function signOut() {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_data');
    
    api.defaults.headers.common['Authorization'] = '';
    
    setUser(null);
  }

  // Função para atualizar dados do usuário
  async function updateUser(data: Partial<User>) {
    try {
      const response = await api.put('/users/profile', data);
      
      const updatedUser = response.data;
      
      await SecureStore.setItemAsync('user_data', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
    } catch (error) {
      throw new Error('Falha ao atualizar perfil.');
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

import axios from 'axios';
// @ts-ignore - Ignorando erros de TypeScript nas importações
import { Platform } from 'react-native';

// Determina o endereço IP baseado na plataforma
const getBaseUrl = () => {
  // Para emuladores Android, use 10.0.2.2 que redireciona para o localhost da máquina host
  if (Platform.OS === 'android' && !__DEV__) {
    return 'http://10.0.2.2:8000';
  }
  
  // Para iOS, use localhost
  if (Platform.OS === 'ios') {
    return 'http://localhost:8000';
  }
  
  // Para dispositivos físicos em desenvolvimento, use o IP da sua máquina na rede local
  return 'http://10.1.0.224:8000';
};

// Configuração base do axios
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Aumentar o timeout para dar mais tempo para o servidor responder
  timeout: 10000,
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros específicos
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro na resposta:', error.response.data);
      
      // Se o token expirou (401), podemos redirecionar para login
      if (error.response.status === 401) {
        // Aqui você pode disparar uma ação para fazer logout
        // Por exemplo: store.dispatch(logout());
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro na requisição:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição
      console.error('Erro:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

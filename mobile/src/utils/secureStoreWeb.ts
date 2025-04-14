// Adaptador simplificado para SecureStore na web
// Implementa a mesma interface que expo-secure-store, mas usa localStorage

// Verificar se estamos em um ambiente que suporta localStorage
const hasLocalStorage = typeof localStorage !== 'undefined';

// Implementação segura das funções
const secureStoreWeb = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (!hasLocalStorage) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Erro ao acessar localStorage:', e);
      return null;
    }
  },
  
  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Erro ao acessar localStorage:', e);
    }
  },
  
  deleteItemAsync: async (key: string): Promise<void> => {
    if (!hasLocalStorage) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Erro ao acessar localStorage:', e);
    }
  }
};

export default secureStoreWeb;

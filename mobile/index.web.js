import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Função simples para inicializar o aplicativo
function startApp() {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('Elemento root não encontrado');
      return;
    }
    
    const root = createRoot(rootElement);
    root.render(createElement(App));
    console.log('Aplicativo inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o aplicativo:', error);
  }
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

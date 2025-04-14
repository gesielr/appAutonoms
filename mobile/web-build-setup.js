// Este arquivo é executado antes da inicialização do aplicativo web
// Ele substitui o ReactDOM.render pelo createRoot do React 18

// Interceptar chamadas para ReactDOM.render
if (typeof window !== 'undefined') {
  // Aguardar o carregamento do DOM
  window.addEventListener('DOMContentLoaded', () => {
    // Substituir ReactDOM.render pelo createRoot
    const originalRender = window.ReactDOM?.render;
    if (originalRender) {
      window.ReactDOM.render = (element, container, callback) => {
        console.log('Usando createRoot em vez de ReactDOM.render');
        const { createRoot } = window.ReactDOM;
        const root = createRoot(container);
        root.render(element);
        if (callback) callback();
        return null;
      };
    }
  });
}

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import App from '../App';

// Substituir o método de renderização padrão do Expo
// para usar createRoot do React 18
const rootTag = document.getElementById('root') || document.getElementById('app');

if (rootTag) {
  const root = createRoot(rootTag);
  root.render(createElement(App));
}

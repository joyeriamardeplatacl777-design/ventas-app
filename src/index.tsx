import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';   // 👈 Importa aquí los estilos de Tailwind
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('Service Worker registrado correctamente'))
      .catch((err) => console.error('Error al registrar Service Worker:', err));
  });
}

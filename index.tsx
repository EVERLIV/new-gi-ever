import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import App from './App';
import i18n from './i18n';

const initializeAndRender = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  try {
    const response = await fetch('./locales/ru.json');
    if (!response.ok) {
        throw new Error(`Failed to fetch translations: ${response.statusText}`);
    }
    const translations = await response.json();

    await i18n.init({
        resources: {
            ru: {
                translation: translations,
            },
        },
        lng: 'ru',
        fallbackLng: 'ru',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Failed to initialize application:", error);
    rootElement.innerHTML = `<div>Error loading application resources. Please check the console for details.</div>`;
  }
};

initializeAndRender();

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialization with resources will now happen asynchronously in index.tsx
// to avoid using import assertions which may not be supported in all environments.
i18n
  .use(initReactI18next);

export default i18n;

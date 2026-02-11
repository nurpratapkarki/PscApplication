import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import np from './locales/np.json';
i18n.use(initReactI18next).init({
  resources: {
    EN: { translation: en },
    NP: { translation: np },
  },
  lng: 'EN',
  fallbackLng: 'EN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from './locales/en';
import { vi } from './locales/vi';

i18n
  // Tự động phát hiện ngôn ngữ người dùng
  .use(LanguageDetector)
  // Kết nối với react-i18next
  .use(initReactI18next)
  // Khởi tạo i18n
  .init({
    resources: {
      en: en,
      vi: vi
    },
    fallbackLng: 'vi', // Ngôn ngữ dự phòng nếu không phát hiện được
    debug: false, // Tắt debug khi chạy production

    interpolation: {
      escapeValue: false // React đã tự động ngăn chặn XSS
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'] // Lưu tùy chọn của người dùng vào LocalStorage
    }
  });

export default i18n;

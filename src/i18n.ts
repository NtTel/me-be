import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";

const savedLang = (() => {
    try {
        return localStorage.getItem("lang");
    } catch {
        return null;
    }
})();

export const formatDate = (date: string | number | Date) => {
    const d = new Date(date);
    const lang = i18n.language || "en";
    // Маппинг кодов i18next на локали Intl, если нужно
    // Но обычно 'en', 'ru' браузер понимает напрямую
    return new Intl.DateTimeFormat(lang, {
        day: "numeric",
        month: "numeric", // или 'long'
        year: "numeric",
    }).format(d);
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
        },
        lng: savedLang || "en",
        fallbackLng: "en",
        supportedLngs: ["en", "ru"],
        load: "languageOnly",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;

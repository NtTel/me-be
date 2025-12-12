import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();
    const lang = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);

    const changeLanguage = (lng: "en" | "ru") => {
        if (lng === lang) return;
        i18n.changeLanguage(lng);
        try {
            localStorage.setItem("lang", lng);
        } catch {
            // ignore
        }
    };

    const baseBtn =
        "px-2 py-1 rounded-md border text-sm transition-colors";
    const inactive =
        "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800";
    const active = "bg-blue-500 text-white border-blue-500";

    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`${baseBtn} ${lang === "en" ? active : inactive}`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => changeLanguage("ru")}
                className={`${baseBtn} ${lang === "ru" ? active : inactive}`}
            >
                RU
            </button>
        </div>
    );
};

export default LanguageSwitcher;

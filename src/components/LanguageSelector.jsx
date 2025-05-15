import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({
  targetLang,
  setTargetLang,
  showLangDropdown,
  setShowLangDropdown,
  theme,
}) => {
  const { t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fa', name: 'Persian' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="relative">
      <label className={`block text-lg font-medium mb-2 text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${
        theme === 'light' ? 'text-gray-800' : 'text-gray-100'
      }`}>
        {t('targetLanguage')}
      </label>
      <div
        className={`w-full p-4 rounded-xl border border-gray-200 cursor-pointer flex justify-between items-center transition-all duration-400 ease-in-out hover:border-[#60a5fa] hover:scale-[1.005] hover:shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-sm`}
        onClick={() => setShowLangDropdown(!showLangDropdown)}
      >
        <span className={`flex-1 text-center font-medium ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}>
          {languages.find((lang) => lang.code === targetLang)?.name || t('selectLanguage')}
        </span>
        <svg className={`w-6 h-6 transition-all duration-400 ease-in-out ${
          showLangDropdown ? 'rotate-180' : ''
        } ${theme === 'light' ? 'text-gray-400 hover:text-blue-600' : 'text-gray-300 hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div
        className={`absolute z-50 mt-2 rounded-xl shadow-lg max-h-60 overflow-y-auto transition-all duration-400 ease-in-out origin-top bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 ${
          showLangDropdown ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
        }`}
        style={{ top: '100%', left: 0, width: '100%', maxWidth: '100%', zIndex: 2000 }}
      >
        {languages.map((lang) => (
          <div
            key={lang.code}
            className={`p-4 hover:bg-gradient-to-r hover:from-[#3b82f6] hover:to-[#60a5fa] hover:text-white cursor-pointer transition-all duration-300 ease-in-out text-center hover:scale-[1.005] ${
              theme === 'light' ? 'text-gray-800' : 'text-gray-100'
            }`}
            onClick={() => {
              setTargetLang(lang.code);
              setShowLangDropdown(false);
            }}
          >
            {lang.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
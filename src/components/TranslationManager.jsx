import React from 'react';
import { useTranslation } from 'react-i18next';

const TranslationManager = ({ translation, handleTranslate, isOfflineMode, theme }) => {
  const { t } = useTranslation();

  return (
    <div className="card p-8 bg-white dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-5 text-center">
        {t('translateSubtitles')}
      </h3>
      <button
        onClick={handleTranslate}
        disabled={translation.isLoading || isOfflineMode}
        className={`w-full py-4 px-6 gradient-button rounded-xl transition-all duration-300 ease-in-out hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 ${
          translation.isLoading ? 'animate-pulse' : ''
        }`}
      >
        {translation.isLoading ? t('translating') : t('translateButton')}
      </button>

      {translation.detectedLang && (
        <p className="mt-4 text-sm text-center text-gray-800 dark:text-gray-100">
          {t('detectedLanguage', { lang: translation.detectedLang })}
        </p>
      )}

      {translation.isLoading && (
        <div className="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
          <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-all duration-700 ease-in-out"
              style={{ width: `${(translation.progress / translation.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2 flex justify-between text-gray-800 dark:text-gray-100">
            <span>{t('progress', { progress: translation.progress, total: translation.total })}</span>
            <span>{((translation.progress / translation.total) * 100).toFixed(1)}%</span>
          </p>
        </div>
      )}

      {translation.error && (
        <div className="mt-5 p-4 rounded-xl bg-red-50 dark:bg-red-900 text-[#ef4444] dark:text-red-200">
          {translation.error}
        </div>
      )}
    </div>
  );
};

export default TranslationManager;
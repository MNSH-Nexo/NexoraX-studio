import React from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeInput } from "./helpers";

const VideoContextInput = ({ topic, setTopic, theme }) => {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <label className={`block text-lg font-medium mb-2 text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${
        theme === 'light' ? 'text-gray-800' : 'text-gray-100'
      }`}>
        {t('videoContext')}
      </label>
      <input
        value={topic}
        onChange={(e) => setTopic(sanitizeInput(e.target.value))}
        placeholder={t('videoContextPlaceholder')}
        className={`w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out text-center hover:scale-[1.005] hover:shadow-md bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-100 shadow-sm`}
        dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
      />
    </div>
  );
};

export default VideoContextInput;
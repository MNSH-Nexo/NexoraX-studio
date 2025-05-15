import React from 'react';
import { useTranslation } from 'react-i18next';

const ApiKeyManager = ({
  apiKeys,
  apiStatus,
  isEncryptionReady,
  updateApiKey,
  removeApiKeyField,
  addApiKeyField,
  clearCache,
  getApiStatusDisplay,
  theme,
}) => {
  const { t, i18n } = useTranslation();

  console.log('clearCache prop in ApiKeyManager:', clearCache);

  const handleClearCache = () => {
    console.log('Clear Cache button clicked');
    if (typeof clearCache === 'function') {
      clearCache();
    } else {
      console.error('clearCache is not a function:', clearCache);
    }
  };

  return (
    <section className="space-y-5">
      <label className={`block text-lg font-medium text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${
        theme === 'light' ? 'text-gray-800' : 'text-gray-100'
      }`}>
        {t('apiKeys')}
      </label>
      <div className="space-y-4">
        {apiKeys.map((key, index) => (
          <div key={index} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <input
                type="password"
                onChange={(e) => updateApiKey(index, e.target.value)}
                placeholder={t('apiKeyPlaceholder', { number: index + 1 })}
                className={`p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out text-center hover:scale-[1.005] hover:shadow-md ${
                  index === 0 ? 'w-full max-w-[556px]' : 'w-full max-w-md'
                } ${!isEncryptionReady ? 'cursor-not-allowed opacity-50' : ''} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-100 shadow-sm`}
                dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                disabled={!isEncryptionReady}
              />
              {index === 0 ? null : (
                <button
                  onClick={() => removeApiKeyField(index)}
                  className="p-4 bg-[#ef4444] text-white rounded-xl hover:bg-[#dc2626] transition-all duration-400 ease-in-out flex items-center justify-center min-w-[60px] h-[52px] hover:scale-105 hover:shadow-lg"
                >
                  {t('delete')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={addApiKeyField}
          className="py-3 px-6 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white rounded-xl shadow-md transition-all duration-400 ease-in-out hover:scale-105 hover:from-[#2563eb] hover:to-[#3b82f6] hover:shadow-lg"
        >
          {t('addNewKey')}
        </button>
        <button
          onClick={handleClearCache}
          className="py-3 px-6 bg-gradient-to-r from-[#ef4444] to-[#f87171] text-white rounded-xl shadow-md transition-all duration-400 ease-in-out hover:scale-105 hover:from-[#dc2626] hover:to-[#ef4444] hover:shadow-lg"
        >
          {t('clearCache')}
        </button>
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(apiStatus).map(([key, statusObj], index) => {
            const { text, color, animation } = getApiStatusDisplay(statusObj.status, statusObj.cooldownUntil);
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.005]`}>
                <span
                  className={`w-4 h-4 rounded-full ${animation}`}
                  style={{
                    background: typeof color === 'string' && color.includes('gradient') ? color : undefined,
                    backgroundColor: typeof color === 'string' && !color.includes('gradient') ? color : undefined,
                  }}
                ></span>
                <span className={`text-sm ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                  {`API ${index + 1}: ${text}`}
                </span>
              </div>
            );
          })}
        </div>
        <p className={`text-sm mt-3 text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          {t('longTranslationTip')}
        </p>
      </div>
    </section>
  );
};

export default ApiKeyManager;
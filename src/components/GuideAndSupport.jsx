import React from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeInput } from './helpers';

const GuideAndSupport = ({
  isGuideOpen,
  setIsGuideOpen,
  isContactOpen,
  setIsContactOpen,
  contactMessage,
  setContactMessage,
  handleSendMessage,
  theme, // این prop هنوز پاس داده می‌شود اما در استایل‌ها استفاده نمی‌شود
}) => {
  const { t, i18n } = useTranslation();

  return (
    <>
      <footer className="card p-8 text-center bg-white dark:bg-gray-800">
        <div onClick={() => setIsGuideOpen(!isGuideOpen)} className="cursor-pointer flex justify-center items-center">
          <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] transition-transform duration-300 ease-in-out hover:scale-105">
            {t('guideAndSupport')} {isGuideOpen ? '▲' : '▼'}
          </h2>
        </div>
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isGuideOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {isGuideOpen && (
            <div className="mt-5 text-right" dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-3">
                {t('usage')}
              </h3>
              <ul className="list-decimal list-inside mt-2 space-y-2 text-gray-800 dark:text-gray-100">
                {t('usageSteps', { returnObjects: true }).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
              <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mt-5 mb-3">
                {t('commonErrors')}
              </h3>
              <ul className="list-disc list-inside mt-2 space-y-2 text-gray-800 dark:text-gray-100">
                {t('errors', { returnObjects: true }).map((error, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: sanitizeInput(error) }} />
                ))}
              </ul>
              <p className="mt-5 text-base text-gray-400 dark:text-gray-500">
                Secured & Developed by Grok 3 - xAI
              </p>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                {t('apiTip')}
              </p>
            </div>
          )}
        </div>
      </footer>

      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
          <button
            onClick={() => setIsContactOpen(!isContactOpen)}
            className={`w-16 h-16 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] flex items-center justify-center shadow-lg transition-transform duration-300 ease-in-out hover:scale-110 hover:rotate-12 ${
              isContactOpen ? 'scale-105 rotate-45' : ''
            }`}
          >
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2 0v10h12V5H4zm2 2h8v2H6V7zm0 3h8v2H6v-2z" />
            </svg>
          </button>
          <div
            className={`absolute bottom-full right-0 mb-4 w-80 rounded-xl shadow-lg p-5 transition-all duration-500 ease-in-out origin-bottom-right ${
              isContactOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            } bg-white dark:bg-gray-800`}
          >
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-3 text-center">
              {t('contactSupport')}
            </h3>
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(sanitizeInput(e.target.value))}
              placeholder={t('contactPlaceholder')}
              className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 resize-y text-center bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              rows="4"
              dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
            />
            <button
              onClick={() => handleSendMessage()}
              className="mt-4 w-full py-3 gradient-button rounded-xl hover:bg-[#2563eb] transition-all duration-400 hover:scale-105"
            >
              {t('sendMessage')}
            </button>
            <p className="mt-2 text-sm text-center text-gray-400 dark:text-gray-500">
              Secured & Developed by Grok 3 - xAI
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuideAndSupport;
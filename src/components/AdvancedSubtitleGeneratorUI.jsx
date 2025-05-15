import React, { useState, useEffect } from 'react';
import ApiKeyManager from './ApiKeyManager';
import LanguageSelector from './LanguageSelector';
import VideoContextInput from './VideoContextInput';
import FileUploader from './FileUploader';
import TranslationManager from './TranslationManager';
import SubtitleEditor from './SubtitleEditor';
import VideoPlayer from './VideoPlayer';
import GuideAndSupport from './GuideAndSupport';
import { multiLayerDecrypt, validateApiKeyFormat } from './helpers';

const AdvancedSubtitleGeneratorUI = ({
  t,
  i18n,
  file,
  setFile,
  targetLang,
  setTargetLang,
  showLangDropdown,
  setShowLangDropdown,
  showSiteLangDropdown,
  setShowSiteLangDropdown,
  selectedModel,
  setSelectedModel,
  apiKeys,
  setApiKeys,
  apiStatus,
  setApiStatus,
  topic,
  setTopic,
  customPrompt,
  setCustomPrompt,
  useCustomPrompt,
  setUseCustomPrompt,
  useCustomTemperature,
  setUseCustomTemperature,
  temperature,
  setTemperature,
  translation,
  setTranslation,
  editedSubtitles,
  setEditedSubtitles,
  searchText,
  setSearchText,
  searchTerm,
  setSearchTerm,
  replaceTerm,
  setReplaceTerm,
  showSearchReplace,
  setShowSearchReplace,
  isGuideOpen,
  setIsGuideOpen,
  isContactOpen,
  setIsContactOpen,
  contactMessage,
  setContactMessage,
  encryptionKeys,
  isEncryptionReady,
  isOfflineMode,
  models,
  handleTranslate,
  updateApiKey,
  addApiKeyField,
  removeApiKeyField,
  getApiStatusDisplay,
  handleSearchAndReplace,
  handleSendMessage,
  updateSubtitle,
  addSubtitle,
  removeSubtitle,
  downloadFile,
  chunkSize,
  setChunkSize,
  clearCache,
}) => {
  console.log('clearCache in AdvancedSubtitleGeneratorUI:', clearCache);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // تعیین حداکثر اندازه چانک بر اساس مدل انتخاب‌شده
  const getMaxChunkSize = () => {
    if (['gemini-2.5-pro-exp-03-25', 'gemini-1.5-pro'].includes(selectedModel)) {
      return 10; // حداکثر 10 برای این مدل‌ها
    }
    return 3; // حداکثر 3 برای بقیه مدل‌ها
  };

  const handleChunkSizeChange = (e) => {
    const value = parseInt(e.target.value);
    const maxChunkSize = getMaxChunkSize();
    if (value >= 1 && value <= maxChunkSize) {
      setChunkSize(value);
    } else if (value > maxChunkSize) {
      setChunkSize(maxChunkSize);
      alert(t('chunkSizeLimitWarning', { max: maxChunkSize }));
    } else {
      setChunkSize(1);
    }
  };

  const incrementChunkSize = () => {
    const maxChunkSize = getMaxChunkSize();
    if (chunkSize < maxChunkSize) {
      setChunkSize(chunkSize + 1);
    } else {
      alert(t('chunkSizeLimitWarning', { max: maxChunkSize }));
    }
  };

  const decrementChunkSize = () => {
    if (chunkSize > 1) {
      setChunkSize(chunkSize - 1);
    }
  };

  const handleTemperatureChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value >= 0 && value <= 2) {
      setTemperature(value);
    } else if (value > 2) {
      setTemperature(2);
      alert(t('temperatureLimitWarning'));
    } else {
      setTemperature(0);
    }
  };

  const incrementTemperature = () => {
    if (temperature < 2) {
      setTemperature(Math.min(2, temperature + 0.1));
    } else {
      alert(t('temperatureLimitWarning'));
    }
  };

  const decrementTemperature = () => {
    if (temperature > 0) {
      setTemperature(Math.max(0, temperature - 0.1));
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-gray-50 to-blue-100 dark:from-gray-900 dark:to-blue-900"
      style={{ direction: 'ltr' }}
    >
      <div className="absolute top-4 right-4 flex space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 bg-blue-600 text-white rounded-lg transition-all duration-300 ease-in-out hover:scale-110 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSiteLangDropdown(!showSiteLangDropdown)}
            className={`flex items-center space-x-2 p-2 bg-blue-600 text-white rounded-lg transition-all duration-300 ease-in-out hover:scale-110 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 ${showSiteLangDropdown ? 'scale-105' : ''}`}
          >
            <span>{i18n.language === 'fa' ? 'FA' : 'EN'}</span>
            <svg className={`w-4 h-4 transition-transform duration-300 ease-in-out ${showSiteLangDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`absolute top-12 right-0 shadow-lg rounded-lg p-2 w-32 transition-all duration-400 ease-in-out origin-top z-50 ${
              showSiteLangDropdown ? 'max-h-40 opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95 pointer-events-none'
            } bg-white dark:bg-gray-800`}
          >
            <button
              onClick={() => {
                i18n.changeLanguage('en');
                setShowSiteLangDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 rounded transition-all duration-200 hover:scale-105 text-gray-800 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-700"
            >
              English
            </button>
            <button
              onClick={() => {
                i18n.changeLanguage('fa');
                setShowSiteLangDropdown(false);
              }}
              className="block w-full text-left px-4 py-2 rounded transition-all duration-200 hover:scale-105 text-gray-800 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-700"
            >
              فارسی
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-12 sm:space-y-12 space-y-4">
        <style>
          {`
            @keyframes shine {
              0% {
                text-shadow: 
                  0 0 2px rgba(255, 255, 255, 0.4),
                  0 0 4px rgba(255, 255, 255, 0.2),
                  0 0 6px rgba(255, 255, 255, 0.1);
              }
              50% {
                text-shadow: 
                  0 0 6px rgba(255, 255, 255, 0.8),
                  0 0 12px rgba(255, 255, 255, 0.5),
                  0 0 18px rgba(255, 255, 255, 0.3);
              }
              100% {
                text-shadow: 
                  0 0 2px rgba(255, 255, 255, 0.4),
                  0 0 4px rgba(255, 255, 255, 0.2),
                  0 0 6px rgba(255, 255, 255, 0.1);
              }
            }
            @keyframes glow {
              0% {
                filter: brightness(1);
              }
              50% {
                filter: brightness(1.2);
              }
              100% {
                filter: brightness(1);
              }
            }
            .metallic-text {
              color: #4B5563;
              animation: 
                shine 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite,
                glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              text-shadow: 
                2px 2px 2px rgba(0, 0, 0, 0.3),
                -1px -1px 1px rgba(255, 255, 255, 0.3),
                0 0 4px rgba(255, 255, 255, 0.3);
              font-family: 'Montserrat', sans-serif;
              font-weight: 700;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              letter-spacing: 1px;
            }
            .dark .metallic-text {
              color: #d0d0d0;
              text-shadow: 
                1px 1px 1px rgba(0, 0, 0, 0.3),
                -1px -1px 1px rgba(255, 255, 255, 0.4),
                0 0 4px rgba(255, 255, 255, 0.3);
            }
            .metallic-text:hover {
              animation-play-state: paused;
              text-shadow: 
                1px 1px 1px rgba(0, 0, 0, 0.2),
                -1px -1px 1px rgba(255, 255, 123, 0.3),
                0 0 8px rgba(255, 255, 255, 0.5);
              filter: brightness(1.3);
            }
            select {
              appearance: none;
              -webkit-appearance: none;
              -moz-appearance: none;
              background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
              background-repeat: no-repeat;
              background-position: right 1rem center;
              background-size: 1em;
              transition: all 0.4s ease-in-out;
              text-align: center;
              text-align-last: center;
            }
            select:focus {
              transform: scale(1.02);
              opacity: 1;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
              border-color: transparent;
            }
            select option {
              background: #f9fafb;
              color: #1f2937;
              text-align: center;
              padding: 0.5rem;
              border-radius: 0.5rem;
            }
            .dark select option {
              background: #1f2937;
              color: #f9fafb;
            }
            .custom-file-upload {
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
              color: white;
              border-radius: 0.75rem;
              cursor: pointer;
              transition: all 0.4s ease-in-out;
              box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
            }
            .custom-file-upload:hover {
              transform: scale(1.05);
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
              box-shadow: 0 6px 15px rgba(59, 130, 246, 0.3);
            }
            .dark .custom-file-upload {
              background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
            }
            .dark .custom-file-upload:hover {
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
              box-shadow: 0 6px 15px rgba(96, 165, 250, 0.3);
            }
            .file-name-display {
              display: inline-block;
              margin-left: 1rem;
              padding: 0.5rem 1rem;
              background-color: #f3f4f6;
              border-radius: 0.5rem;
              color: #374151;
            }
            .dark .file-name-display {
              background-color: #374151;
              color: #d1d5db;
            }
            .chunk-size-input, .temperature-input {
              width: 100%;
              padding: 0.75rem 1rem;
              border: 1px solid #d1d5db;
              border-radius: 0.75rem;
              background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
              color: #1f2937;
              transition: all 0.4s ease-in-out;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }
            .dark .chunk-size-input, .dark .temperature-input {
              background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
              color: #d1d5db;
              border-color: #4b5563;
            }
            .chunk-size-input:focus, .temperature-input:focus {
              outline: none;
              border-color: #3b82f6;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
              transform: scale(1.01);
            }
            .chunk-size-input:hover, .temperature-input:hover {
              transform: scale(1.01);
              border-color: #3b82f6;
            }
            .chunk-size-input::placeholder, .temperature-input::placeholder {
              font-size: 0.875rem;
              text-align: center;
            }
            textarea {
              text-align: center;
            }
            textarea::placeholder {
              font-size: 0.875rem;
              text-align: center;
            }
            .custom-prompt-textarea {
              background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
              transition: all 0.4s ease-in-out;
            }
            .dark .custom-prompt-textarea {
              background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
            }
            .custom-prompt-textarea:focus {
              transform: scale(1.01);
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
            }
            .toggle-switch {
              position: relative;
              display: inline-block;
              width: 60px;
              height: 34px;
            }
            .toggle-switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }
            .toggle-slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
              transition: all 0.4s ease-in-out;
              border-radius: 34px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .toggle-slider:before {
              position: absolute;
              content: "";
              height: 26px;
              width: 26px;
              left: 4px;
              bottom: 4px;
              background: white;
              transition: all 0.4s ease-in-out;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            input:checked + .toggle-slider {
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
            }
            input:checked + .toggle-slider:before {
              transform: translateX(26px);
            }
            .dark .toggle-slider {
              background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
            }
            .dark input:checked + .toggle-slider {
              background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
            }
            .increment-decrement-btn {
              padding: 0.75rem 1.25rem;
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
              color: white;
              border-radius: 9999px;
              transition: all 0.4s ease-in-out;
              box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
              font-size: 1.25rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
            }
            .increment-decrement-btn:hover {
              transform: scale(1.05);
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
              box-shadow: 0 6px 15px rgba(59, 130, 246, 0.3);
            }
            .dark .increment-decrement-btn {
              background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
            }
            .dark .increment-decrement-btn:hover {
              background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
              box-shadow: 0 6px 15px rgba(96, 165, 250, 0.3);
            }
            @media (max-width: 640px) {
              .subtitle-editor {
                width: 100%;
                min-height: 300px;
              }
              .subtitle-editor > * {
                width: 100%;
              }
            }
            @media (max-width: 640px) {
              .translation-manager {
                width: 100%;
              }
              .translation-manager > * {
                width: 100%;
              }
            }
            @media (max-width: 640px) {
              .card {
                margin: 0 auto;
                width: 100%;
                max-width: 90vw;
              }
            }
          `}
        </style>
        <header className="flex sm:justify-start justify-center" style={{ direction: 'ltr' }}>
          <h1
            className="text-4xl font-bold metallic-text transition-all duration-300 ease-in-out hover:scale-[1.005]"
            style={{ transform: 'perspective(500px) rotateX(3deg)' }}
            dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
          >
            NexoraX Studio
          </h1>
        </header>

        <main className="flex flex-col-reverse sm:flex-col lg:flex-row gap-10" style={{ direction: 'ltr' }}>
          <div className="lg:w-3/5 card rounded-3xl shadow-xl p-12 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005] bg-gray-50 dark:bg-gray-900 text-center lg:text-left">
            <div className="space-y-12 sm:space-y-12 space-y-4 flex flex-col" style={{ direction: 'ltr' }}>
              <div className="hidden sm:block">
                <div className="flex items-center space-x-8 space-x-reverse mb-4 justify-center lg:justify-start">
                  <h2
                    className="text-2xl lg:text-3xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center sm:text-left"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('Video Player')}
                  </h2>
                </div>
                <div className="video-player">
                  <VideoPlayer file={file} translation={translation} targetLang={targetLang} theme={theme} />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-8 space-x-reverse mb-4 justify-center lg:justify-start">
                  <h2
                    className="text-2xl lg:text-3xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center sm:text-left"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('Subtitle Editor')}
                  </h2>
                </div>
                <div className="subtitle-editor">
                  <SubtitleEditor
                    translation={translation}
                    editedSubtitles={editedSubtitles}
                    setEditedSubtitles={setEditedSubtitles}
                    searchText={searchText}
                    setSearchText={setSearchText}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    replaceTerm={replaceTerm}
                    setReplaceTerm={setReplaceTerm}
                    showSearchReplace={showSearchReplace}
                    setShowSearchReplace={setShowSearchReplace}
                    handleSearchAndReplace={handleSearchAndReplace}
                    updateSubtitle={updateSubtitle}
                    addSubtitle={addSubtitle}
                    removeSubtitle={removeSubtitle}
                    downloadFile={(content) => downloadFile(content, `translated_subtitle.${file?.name.split('.').pop() || 'srt'}`)}
                    targetLang={targetLang}
                    file={file}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-2/5 card rounded-3xl shadow-xl p-12 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.005] bg-gray-50 dark:bg-gray-900 text-center">
            <div className="space-y-8 sm:space-y-8 space-y-4" style={{ direction: 'ltr' }}>
              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('AI Model')}
                  </h2>
                </div>
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full sm:w-3/4 p-4 rounded-xl border border-gray-200 transition-all duration-400 ease-in-out hover:scale-[1.005] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-md hover:shadow-lg mx-auto"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id} className="p-2 rounded-lg">
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('API Manager')}
                  </h2>
                </div>
                <ApiKeyManager
                  apiKeys={apiKeys[selectedModel.includes('gemini') ? 'gemini' : selectedModel]}
                  setApiKeys={(newKeys) =>
                    setApiKeys((prev) => ({ ...prev, [selectedModel.includes('gemini') ? 'gemini' : selectedModel]: newKeys }))
                  }
                  apiStatus={apiStatus}
                  setApiStatus={setApiStatus}
                  encryptionKeys={encryptionKeys}
                  isEncryptionReady={isEncryptionReady}
                  updateApiKey={(index, value) => updateApiKey(selectedModel.includes('gemini') ? 'gemini' : selectedModel, index, value)}
                  removeApiKeyField={(index) => removeApiKeyField(selectedModel.includes('gemini') ? 'gemini' : selectedModel, index)}
                  addApiKeyField={() => addApiKeyField(selectedModel.includes('gemini') ? 'gemini' : selectedModel)}
                  clearCache={clearCache}
                  getApiStatusDisplay={getApiStatusDisplay}
                  theme={theme}
                />
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('languageSettings')}
                  </h2>
                </div>
                <LanguageSelector
                  targetLang={targetLang}
                  setTargetLang={setTargetLang}
                  showLangDropdown={showLangDropdown}
                  setShowLangDropdown={setShowLangDropdown}
                  theme={theme}
                />
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('videoContext')}
                  </h2>
                </div>
                <VideoContextInput topic={topic} setTopic={setTopic} theme={theme} />
                <div className="mt-4">
                  <label className="flex flex-col items-center justify-center space-y-2">
                    <span
                      className="text-base lg:text-lg font-medium transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-700 dark:text-gray-200 text-center"
                      dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                    >
                      {t('Custom Prompt')}
                    </span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={useCustomPrompt}
                        onChange={(e) => setUseCustomPrompt(e.target.checked)}
                        id="customPromptToggle"
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      useCustomPrompt ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {useCustomPrompt && (
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={t('customPromptPlaceholder')}
                        className="custom-prompt-textarea mt-3 w-full sm:w-3/4 p-4 rounded-xl border border-gray-200 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-800 dark:text-gray-100 mx-auto block"
                        rows={4}
                        dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex flex-col items-center justify-center space-y-2">
                    <span
                      className="text-base lg:text-lg font-medium transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-700 dark:text-gray-200 text-center"
                      dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                    >
                      {t('Custom Temperature')}
                    </span>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={useCustomTemperature}
                        onChange={(e) => setUseCustomTemperature(e.target.checked)}
                        id="customTemperatureToggle"
                      />
                      <span className="toggle-slider"></span>
                    </div>
                  </label>
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      useCustomTemperature ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {useCustomTemperature && (
                      <div className="flex items-center justify-center space-x-4 mt-3">
                        <button
                          onClick={decrementTemperature}
                          className="increment-decrement-btn"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={temperature.toFixed(1)}
                          onChange={handleTemperatureChange}
                          min="0"
                          max="2"
                          step="0.1"
                          className="temperature-input w-24 text-center mx-auto"
                          placeholder={t('enterTemperature')}
                          dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                        />
                        <button
                          onClick={incrementTemperature}
                          className="increment-decrement-btn"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('uploadSubtitle')}
                  </h2>
                </div>
                <FileUploader file={file} setFile={setFile} theme={theme} />
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('Chunk Size')}
                  </h2>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={decrementChunkSize}
                    className="increment-decrement-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={chunkSize}
                    onChange={handleChunkSizeChange}
                    min="1"
                    className="chunk-size-input w-24 text-center mx-auto"
                    placeholder={t('enterChunkSize')}
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  />
                  <button
                    onClick={incrementChunkSize}
                    className="increment-decrement-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center space-x-8 space-x-reverse mb-4">
                  <h2
                    className="text-2xl lg:text-2xl font-semibold transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-800 dark:text-gray-100 text-center"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {t('translate')}
                  </h2>
                </div>
                <div className="translation-manager">
                  <TranslationManager translation={translation} handleTranslate={handleTranslate} isOfflineMode={isOfflineMode} theme={theme} />
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-16 text-center" style={{ direction: 'ltr' }}>
          <GuideAndSupport
            isGuideOpen={isGuideOpen}
            setIsGuideOpen={setIsGuideOpen}
            isContactOpen={isContactOpen}
            setIsContactOpen={setIsContactOpen}
            contactMessage={contactMessage}
            setContactMessage={setContactMessage}
            handleSendMessage={handleSendMessage}
            theme={theme}
          />
          <p className="text-sm mt-4 transition-transform duration-300 ease-in-out hover:scale-[1.005] text-gray-500 dark:text-gray-400" dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
            Powered by <span className="font-semibold">Grok 3 - xAI</span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdvancedSubtitleGeneratorUI;
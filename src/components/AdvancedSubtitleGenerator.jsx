import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AdvancedSubtitleGeneratorUI from './AdvancedSubtitleGeneratorUI';
import {
  cacheTranslation,
  getCachedTranslation,
  clearCache,
  delay,
  splitTextIntoChunks,
  downloadFile,
  sanitizeInput,
  generateEncryptionKeys,
  multiLayerEncrypt,
  multiLayerDecrypt,
  validateApiKeyFormat,
  isOnline,
  translateWithGemini,
  translateWithGrok,
  translateWithChatGPT,
  translateWithDeepSeek,
  detectLanguageWithGemini,
  parseSubtitle,
  blocksToString,
  cleanTranslatedText,
} from './helpers';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

const AdvancedSubtitleGenerator = () => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState(null);
  const [targetLang, setTargetLang] = useState('fa');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showSiteLangDropdown, setShowSiteLangDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [apiKeys, setApiKeys] = useState({
    gemini: [{ encryptedData: '', hmac: '', iv: '' }],
    grok: [{ encryptedData: '', hmac: '', iv: '' }],
    chatgpt: [{ encryptedData: '', hmac: '', iv: '' }],
    deepseek: [{ encryptedData: '', hmac: '', iv: '' }],
  });
  const [apiStatus, setApiStatus] = useState({});
  const [apiGroups, setApiGroups] = useState([]);
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [useCustomTemperature, setUseCustomTemperature] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [translation, setTranslation] = useState({
    isLoading: false,
    error: null,
    result: null,
    partialResult: '',
    progress: 0,
    total: 0,
    detectedLang: null,
    parsedData: {},
  });
  const [editedSubtitles, setEditedSubtitles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [encryptionKeys, setEncryptionKeys] = useState(null);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [chunkSize, setChunkSize] = useState(1);
  const hasInitializedRef = useRef(false);
  const prevEditedSubtitlesRef = useRef([]);
  const isEditingRef = useRef(false);

  const models = [
    { id: 'gemini-2.0-flash', name: 'Google Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Google Gemini 2.0 Flash Lite' },
    { id: 'gemini-2.5-pro-exp-03-25', name: 'Google Gemini 2.5 Pro Preview exp' },
    { id: 'gemini-2.5-flash-preview-04-17', name: 'Google Gemini 2.5 Flash Preview' },
    { id: 'gemini-1.5-flash', name: 'Google Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Google Gemini 1.5 Pro' },
    { id: 'grok', name: 'Grok (xAI)' },
    { id: 'chatgpt', name: 'ChatGPT (OpenAI)' },
    { id: 'deepseek', name: 'DeepSeek' },
  ];

  const updateTranslationResult = useCallback(() => {
    if (!file || !editedSubtitles.length) return;
    const outputFormat = file.name.split('.').pop().toLowerCase();
    const updatedResult = blocksToString(editedSubtitles, outputFormat, translation.parsedData);
    setTranslation((prev) => ({
      ...prev,
      result: updatedResult,
      error: null,
    }));
  }, [file, editedSubtitles, translation.parsedData]);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeEncryption = () => {
      const newKeys = generateEncryptionKeys();
      setEncryptionKeys(newKeys);
      setIsEncryptionReady(true);
    };

    initializeEncryption();

    const storedApiKeys = sessionStorage.getItem('encryptedApiKeys');
    if (storedApiKeys) {
      try {
        const parsedKeys = JSON.parse(storedApiKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        sessionStorage.removeItem('encryptedApiKeys');
        setApiKeys({
          gemini: [{ encryptedData: '', hmac: '', iv: '' }],
          grok: [{ encryptedData: '', hmac: '', iv: '' }],
          chatgpt: [{ encryptedData: '', hmac: '', iv: '' }],
          deepseek: [{ encryptedData: '', hmac: '', iv: '' }],
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const validKeys = Object.keys(apiKeys).reduce((acc, model) => {
      acc[model] = apiKeys[model].filter((key) => key.encryptedData && key.hmac && key.iv);
      return acc;
    }, {});
    sessionStorage.setItem('encryptedApiKeys', JSON.stringify(validKeys));
  }, [apiKeys]);

  useEffect(() => {
    if (translation.result && file && !isEditingRef.current) {
      const parsed = parseSubtitle(translation.result, file.name);
      const subtitles = Array.isArray(parsed) ? parsed : parsed.subtitles || [];
      const parsedData = Array.isArray(parsed) ? {} : { scriptInfo: parsed.scriptInfo, styles: parsed.styles };
      setEditedSubtitles(subtitles);
      setTranslation((prev) => ({ ...prev, parsedData }));
    }
  }, [translation.result, file]);

  const debouncedUpdateResult = useRef(
    debounce((subtitles, file, parsedData) => {
      if (!file) return;
      const outputFormat = file.name.split('.').pop().toLowerCase();
      const updatedResult = blocksToString(subtitles, outputFormat, parsedData);
      setTranslation((prev) => ({
        ...prev,
        result: updatedResult,
        error: null,
      }));
    }, 200)
  ).current;

  useEffect(() => {
    if (editedSubtitles.length > 0 && file && !isEditingRef.current) {
      if (!isEqual(editedSubtitles, prevEditedSubtitlesRef.current)) {
        debouncedUpdateResult(editedSubtitles, file, translation.parsedData);
        prevEditedSubtitlesRef.current = editedSubtitles;
      }
    }
  }, [editedSubtitles, file, translation.parsedData]);

  const updateApiKey = (model, index, value) => {
    if (!isEncryptionReady || !encryptionKeys) {
      alert('Encryption keys not available. Please refresh the page.');
      return;
    }
    if (!value.trim()) {
      removeApiKeyField(model, index);
      return;
    }
    if (!validateApiKeyFormat(value)) {
      alert('Invalid API key format! Please enter a valid key.');
      return;
    }
    const sanitizedValue = sanitizeInput(value);
    const encryptedValue = multiLayerEncrypt(sanitizedValue, encryptionKeys.aesKey, encryptionKeys.publicKey, encryptionKeys.hmacKey);
    setApiKeys((prev) => ({
      ...prev,
      [model]: prev[model].map((key, i) => (i === index ? encryptedValue : key)),
    }));
    setApiStatus((prev) => {
      const newStatus = {};
      const validKeys = apiKeys[model]
        .map((key, i) => {
          if (i === index) return encryptedValue;
          return key;
        })
        .filter((key) => key.encryptedData)
        .map((key) => multiLayerDecrypt(key, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey))
        .filter((key) => key.trim() !== '');
      validKeys.forEach((key) => {
        const encryptedKey = multiLayerEncrypt(key, encryptionKeys.aesKey, encryptionKeys.publicKey, encryptionKeys.hmacKey);
        newStatus[encryptedKey.encryptedData] =
          prev[encryptedKey.encryptedData] || { status: 'available', lastUsed: 0, cooldownUntil: 0, rateLimitHits: 0, usageCount: 0 };
      });
      return newStatus;
    });
  };

  const addApiKeyField = (model) => {
    setApiKeys((prev) => ({
      ...prev,
      [model]: [...prev[model], { encryptedData: '', hmac: '', iv: '' }],
    }));
  };

  const removeApiKeyField = (model, index) => {
    setApiKeys((prev) => ({
      ...prev,
      [model]: prev[model].filter((_, i) => i !== index),
    }));
    setApiStatus((prev) => {
      const newStatus = {};
      const remainingKeys = apiKeys[model]
        .filter((_, i) => i !== index)
        .map((key) => multiLayerDecrypt(key, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey))
        .filter((key) => key.trim() !== '');
      remainingKeys.forEach((key) => {
        const encryptedKey = multiLayerEncrypt(key, encryptionKeys.aesKey, encryptionKeys.publicKey, encryptionKeys.hmacKey);
        newStatus[encryptedKey.encryptedData] =
          prev[encryptedKey.encryptedData] || { status: 'available', lastUsed: 0, cooldownUntil: 0, rateLimitHits: 0, usageCount: 0 };
      });
      return newStatus;
    });
  };

  const getApiStatusDisplay = (status, cooldownUntil) => {
    const now = Date.now();
    if (status === 'available') return { text: t('apiAvailable'), color: '#34d399', animation: 'pulse' };
    else if (status === 'in_use')
      return { text: t('apiInUse'), color: 'linear-gradient(90deg, #3b82f6, #60a5fa)', animation: 'spin' };
    else {
      const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      if (remainingSeconds === 0) {
        setApiStatus((prev) => ({
          ...prev,
          [Object.keys(prev).find((key) => prev[key].cooldownUntil === cooldownUntil)]: {
            ...prev[Object.keys(prev).find((key) => prev[key].cooldownUntil === cooldownUntil)],
            status: 'available',
            cooldownUntil: 0,
          },
        }));
        return { text: t('apiAvailable'), color: '#34d399', animation: 'pulse' };
      }
      return { text: t('apiCooldown', { seconds: remainingSeconds }), color: '#ef4444', animation: 'pulse' };
    }
  };

  const detectLanguage = async (text) => {
    try {
      const lang = await detectLanguageWithGemini(text, apiKeys.gemini[0], encryptionKeys);
      return lang;
    } catch (error) {
      throw new Error('Failed to detect language: ' + error.message);
    }
  };

  const distributeBackupKeys = (primaryKeys, backupKeys) => {
    const distribution = Array(primaryKeys.length).fill().map(() => []);
    const totalBackups = backupKeys.length;
    const baseCount = Math.floor(totalBackups / primaryKeys.length);
    const extraCount = totalBackups % primaryKeys.length;

    let backupIndex = 0;
    for (let i = 0; i < primaryKeys.length; i++) {
      const count = baseCount + (i < extraCount ? 1 : 0);
      for (let j = 0; j < count; j++) {
        if (backupIndex < backupKeys.length) {
          distribution[i].push(backupKeys[backupIndex]);
          backupIndex++;
        }
      }
    }

    return distribution;
  };

  const calculateKeyScore = (key) => {
    const now = Date.now();
    const status = apiStatus[key.encryptedData] || { rateLimitHits: 0, usageCount: 0, lastUsed: 0 };
    
    const rateLimitWeight = 10;
    const usageWeight = 2;
    const timeWeight = 0.001;

    const timeSinceLastUse = now - status.lastUsed;

    let score = 100;
    score -= status.rateLimitHits * rateLimitWeight;
    score -= status.usageCount * usageWeight;
    score += timeSinceLastUse * timeWeight;

    return Math.max(0, score);
  };

  const getAvailableKey = (allKeys) => {
    const now = Date.now();
    const availableKeys = allKeys.filter((key) => {
      const status = apiStatus[key.encryptedData] || { status: 'available', cooldownUntil: 0 };
      return status.status === 'available' && now >= status.cooldownUntil;
    });

    if (availableKeys.length === 0) return null;

    availableKeys.sort((a, b) => calculateKeyScore(b) - calculateKeyScore(a));

    return availableKeys[0];
  };

  const translateText = async (text, targetLang, primaryKey, backupKeys) => {
    const cacheKey = `text-${text}-${targetLang}-${selectedModel}-${temperature}`;
    const cachedResult = getCachedTranslation(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    let translatedText = null;
    const maxAttempts = 10;
    const retryDelay = 3000;
    const longCooldown = 60000;

    const allKeys = [primaryKey, ...backupKeys];
    let attemptCount = 0;
    let usedKeys = new Set();

    while (attemptCount < maxAttempts) {
      const availableKey = getAvailableKey(allKeys.filter((key) => !usedKeys.has(key.encryptedData)));
      
      if (availableKey) {
        const now = Date.now();
        setApiStatus((prev) => ({
          ...prev,
          [availableKey.encryptedData]: {
            ...prev[availableKey.encryptedData],
            status: 'in_use',
            lastUsed: now,
            usageCount: (prev[availableKey.encryptedData]?.usageCount || 0) + 1,
          },
        }));

        try {
          if (selectedModel.includes('gemini')) {
            console.log(`Sending request to Gemini API at ${new Date().toISOString()} for model: ${selectedModel}`);
            translatedText = await translateWithGemini(
              text,
              targetLang,
              availableKey,
              encryptionKeys,
              topic,
              useCustomPrompt ? customPrompt : '',
              selectedModel,
              useCustomTemperature ? temperature : undefined
            );
            console.log(`Received response from Gemini API at ${new Date().toISOString()} for model: ${selectedModel}`);
          } else if (selectedModel === 'grok') {
            translatedText = await translateWithGrok(
              text,
              targetLang,
              availableKey,
              encryptionKeys,
              topic,
              useCustomPrompt ? customPrompt : '',
              undefined,
              useCustomTemperature ? temperature : undefined
            );
          } else if (selectedModel === 'chatgpt') {
            translatedText = await translateWithChatGPT(
              text,
              targetLang,
              availableKey,
              encryptionKeys,
              topic,
              useCustomPrompt ? customPrompt : '',
              undefined,
              useCustomTemperature ? temperature : undefined
            );
          } else if (selectedModel === 'deepseek') {
            translatedText = await translateWithDeepSeek(
              text,
              targetLang,
              availableKey,
              encryptionKeys,
              topic,
              useCustomPrompt ? customPrompt : '',
              undefined,
              useCustomTemperature ? temperature : undefined
            );
          }
          translatedText = cleanTranslatedText(translatedText);
          cacheTranslation(cacheKey, translatedText);
          setApiStatus((prev) => ({
            ...prev,
            [availableKey.encryptedData]: {
              ...prev[availableKey.encryptedData],
              status: 'available',
              lastUsed: now,
              cooldownUntil: 0,
            },
          }));
          break;
        } catch (error) {
          if (error.message.includes('Rate Limit') || error.message.includes('429')) {
            const now = Date.now();
            setApiStatus((prev) => ({
              ...prev,
              [availableKey.encryptedData]: {
                ...prev[availableKey.encryptedData],
                status: 'cooldown',
                lastUsed: now,
                cooldownUntil: now + retryDelay,
                rateLimitHits: (prev[availableKey.encryptedData]?.rateLimitHits || 0) + 1,
              },
            }));
            usedKeys.add(availableKey.encryptedData);
            const nextAvailableKey = getAvailableKey(allKeys.filter((key) => !usedKeys.has(key.encryptedData)));
            if (nextAvailableKey) {
              continue;
            } else {
              const cooldowns = allKeys
                .map((key) => apiStatus[key.encryptedData]?.cooldownUntil || 0)
                .filter((cooldown) => cooldown > now);
              if (cooldowns.length > 0) {
                const shortestCooldown = Math.min(...cooldowns);
                const waitTime = shortestCooldown - now;
                await delay(waitTime);
              }
              attemptCount++;
              usedKeys.clear();
            }
          } else {
            throw new Error(`Translation failed: ${error.message}`);
          }
        }
      } else {
        const now = Date.now();
        const cooldowns = allKeys
          .map((key) => apiStatus[key.encryptedData]?.cooldownUntil || 0)
          .filter((cooldown) => cooldown > now);
        if (cooldowns.length > 0) {
          const shortestCooldown = Math.min(...cooldowns);
          const waitTime = shortestCooldown - now;
          await delay(waitTime);
        }
        attemptCount++;
        usedKeys.clear();
      }
    }

    if (translatedText === null) {
      const now = Date.now();
      setApiStatus((prev) => {
        const updatedStatus = { ...prev };
        allKeys.forEach((key) => {
          updatedStatus[key.encryptedData] = {
            ...updatedStatus[key.encryptedData],
            status: 'cooldown',
            cooldownUntil: now + longCooldown,
          };
        });
        return updatedStatus;
      });
      translatedText = text;
    }

    return translatedText;
  };

  const translateChunks = async (chunks, targetLang, updateProgress) => {
    const results = [];
    let processedBlocks = 0;

    const validApiKeys = apiKeys[selectedModel.includes('gemini') ? 'gemini' : selectedModel].filter((key) => {
      try {
        const decrypted = multiLayerDecrypt(key, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
        return decrypted.trim() !== '' && validateApiKeyFormat(decrypted);
      } catch {
        return false;
      }
    });

    if (validApiKeys.length === 0) {
      throw new Error(`Please enter at least one valid API key for ${selectedModel}!`);
    }

    const newApiStatus = {};
    validApiKeys.forEach((key) => {
      newApiStatus[key.encryptedData] = apiStatus[key.encryptedData] || {
        status: 'available',
        lastUsed: 0,
        cooldownUntil: 0,
        rateLimitHits: 0,
        usageCount: 0,
      };
    });
    setApiStatus(newApiStatus);

    const primaryKey = validApiKeys[0];
    const backupKeys = validApiKeys.slice(1);
    setApiGroups([{ primary: primaryKey, backups: backupKeys }]);

    const processChunk = async (chunk, primaryKey, backups) => {
      if (chunk.every(node => !node.text || node.text.trim() === '')) {
        const alignedBlocks = chunk.map((node) => ({
          index: node.index,
          start: node.start,
          end: node.end,
          timing: `${node.start} --> ${node.end}`,
          text: '',
          style: node.style,
          lineTags: node.lineTags,
        }));
        processedBlocks += chunk.length;
        updateProgress(processedBlocks);
        return { success: true, blocks: alignedBlocks };
      }

      const maxSubChunkSize = ['gemini-2.5-pro-exp-03-25', 'gemini-1.5-pro'].includes(selectedModel) ? Math.min(chunkSize, 10) : Math.min(chunkSize, 3);
      const subChunks = [];
      for (let j = 0; j < chunk.length; j += maxSubChunkSize) {
        subChunks.push(chunk.slice(j, j + maxSubChunkSize));
      }

      const translatedSubChunks = [];
      for (const subChunk of subChunks) {
        let translatedBlocks;
        try {
          translatedBlocks = await translateSubChunk(subChunk, targetLang, primaryKey, backups);
          translatedSubChunks.push({ success: true, blocks: translatedBlocks });
        } catch (error) {
          const retryBlocks = [];
          for (const node of subChunk) {
            try {
              const translatedText = await translateText(node.text, targetLang, primaryKey, backups);
              retryBlocks.push({
                index: node.index,
                start: node.start,
                end: node.end,
                timing: `${node.start} --> ${node.end}`,
                text: translatedText,
                style: node.style,
                lineTags: node.lineTags,
              });
            } catch (retryError) {
              retryBlocks.push({
                index: node.index,
                start: node.start,
                end: node.end,
                timing: `${node.start} --> ${node.end}`,
                text: node.text,
                style: node.style,
                lineTags: node.lineTags,
              });
            }
          }
          translatedSubChunks.push({ success: false, blocks: retryBlocks, error: error.message });
        }
      }

      const alignedBlocks = translatedSubChunks.flatMap(result => result.blocks);
      processedBlocks += chunk.length;
      updateProgress(processedBlocks);
      return {
        success: translatedSubChunks.every(result => result.success),
        blocks: alignedBlocks,
        error: translatedSubChunks.find(result => !result.success)?.error,
      };
    };

    for (let i = 0; i < chunks.length; i++) {
      const result = await processChunk(chunks[i], primaryKey, backupKeys);
      results.push(result);
    }

    return results;
  };

  const translateSubChunk = async (subChunk, targetLang, primaryKey, backupKeys) => {
    const translatedBlocks = [];
    for (let j = 0; j < subChunk.length; j++) {
      const node = subChunk[j];
      if (!node.text || node.text.trim() === '') {
        translatedBlocks.push({
          index: node.index,
          start: node.start,
          end: node.end,
          timing: `${node.start} --> ${node.end}`,
          text: '',
          style: node.style,
          lineTags: node.lineTags,
        });
        continue;
      }

      const cacheKey = `subchunk-${node.index}-${node.text}-${targetLang}-${selectedModel}-${temperature}`;
      const cachedResult = getCachedTranslation(cacheKey);

      if (cachedResult) {
        translatedBlocks.push({
          index: node.index,
          start: node.start,
          end: node.end,
          timing: `${node.start} --> ${node.end}`,
          text: cachedResult,
          style: node.style,
          lineTags: node.lineTags,
        });
        continue;
      }

      try {
        const translatedText = await translateText(node.text, targetLang, primaryKey, backupKeys);
        translatedBlocks.push({
          index: node.index,
          start: node.start,
          end: node.end,
          timing: `${node.start} --> ${node.end}`,
          text: translatedText,
          style: node.style,
          lineTags: node.lineTags,
        });
        cacheTranslation(cacheKey, translatedText);
      } catch (error) {
        translatedBlocks.push({
          index: node.index,
          start: node.start,
          end: node.end,
          timing: `${node.start} --> ${node.end}`,
          text: node.text,
          style: node.style,
          lineTags: node.lineTags,
        });
      }
    }
    return translatedBlocks;
  };

  const chunkSubtitles = (subtitles, size) => {
    const maxChunkSize = ['gemini-2.5-pro-exp-03-25', 'gemini-1.5-pro'].includes(selectedModel) ? 10 : 3;
    const effectiveSize = Math.min(size || 1, maxChunkSize);
    const chunks = [];
    for (let i = 0; i < subtitles.length; i += effectiveSize) {
      chunks.push(subtitles.slice(i, i + effectiveSize));
    }
    return chunks;
  };

  const handleTranslate = async () => {
    if (!file) {
      setTranslation((prev) => ({ ...prev, error: t('errorNoFile') }));
      return;
    }

    if (!isOnline() && !isOfflineMode) {
      setTranslation((prev) => ({ ...prev, error: t('errorNoInternet') }));
      return;
    }

    if (useCustomPrompt && !customPrompt.trim()) {
      setTranslation((prev) => ({ ...prev, error: t('errorEmptyPrompt') }));
      return;
    }

    const validApiKeys = apiKeys[selectedModel.includes('gemini') ? 'gemini' : selectedModel].filter((key) => {
      try {
        const decrypted = multiLayerDecrypt(key, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
        return decrypted.trim() !== '' && validateApiKeyFormat(decrypted);
      } catch {
        return false;
      }
    });
    if (validApiKeys.length === 0) {
      setTranslation((prev) => ({ ...prev, error: t('errorNoApiKey', { model: selectedModel }) }));
      return;
    }

    setTranslation({
      isLoading: true,
      error: null,
      result: null,
      partialResult: '',
      progress: 0,
      total: 0,
      detectedLang: null,
      parsedData: {},
    });

    try {
      const text = await file.text();
      const cachedResult = getCachedTranslation(`translation_${text}_${targetLang}_${topic}_${customPrompt}_${selectedModel}_${temperature}`);
      if (cachedResult && !isOfflineMode) {
        setTranslation((prev) => ({ ...prev, result: cachedResult, isLoading: false }));
        return;
      }
      const detectedLang = await detectLanguage(text);
      const parsed = parseSubtitle(text, file.name);
      const blocks = Array.isArray(parsed) ? parsed : parsed.subtitles || [];
      const parsedData = Array.isArray(parsed) ? {} : { scriptInfo: parsed.scriptInfo, styles: parsed.styles };
      setTranslation((prev) => ({ ...prev, parsedData }));
      const chunks = chunkSubtitles(blocks, chunkSize);
      const totalBlocks = blocks.length;
      setTranslation((prev) => ({ ...prev, total: totalBlocks, detectedLang }));

      const updateProgress = (newProgress) => {
        setTranslation((prev) => ({ ...prev, progress: newProgress }));
      };
      const translatedResults = await translateChunks(chunks, targetLang, updateProgress);
      let partialResult = '';
      const allBlocks = [];

      for (let i = 0; i < translatedResults.length; i++) {
        const result = translatedResults[i];
        if (result.success) {
          allBlocks.push(...result.blocks);
          partialResult = blocksToString(allBlocks, file.name.split('.').pop().toLowerCase(), parsedData);
          setTranslation((prev) => ({ ...prev, partialResult: partialResult.trim() }));
        } else {
          allBlocks.push(...result.blocks);
          setTranslation((prev) => ({ ...prev, error: result.error || t('errorPartialTranslation') }));
        }
      }

      const outputFormat = file.name.split('.').pop().toLowerCase();
      const finalText = blocksToString(allBlocks, outputFormat, parsedData);
      cacheTranslation(`translation_${text}_${targetLang}_${topic}_${customPrompt}_${selectedModel}_${temperature}`, finalText);
      setTranslation({
        isLoading: false,
        error: null,
        result: finalText,
        partialResult: '',
        progress: totalBlocks,
        total: totalBlocks,
        detectedLang,
        parsedData,
      });
    } catch (error) {
      let errorMessage = t('errorGeneral');
      if (error.message.includes('API key')) errorMessage = t('errorInvalidApiKey', { model: selectedModel });
      else if (error.message.includes('network')) errorMessage = t('errorNetwork');
      else if (error.message.includes('Failed to fetch')) errorMessage = t('errorApiConnection');
      else if (error.message.includes('429')) errorMessage = t('errorRateLimit');
      else if (error.message.includes('Request timed out')) errorMessage = t('errorTimeout');
      else if (error.message.includes('Unsupported subtitle format')) errorMessage = t('errorUnsupportedFormat');
      setTranslation((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  };

  const updateSubtitle = (index, field, value) => {
    isEditingRef.current = true;
    setEditedSubtitles((prev) => {
      const newSubtitles = [...prev];
      newSubtitles[index] = { ...newSubtitles[index], [field]: value };
      return newSubtitles;
    });
    setTimeout(() => {
      isEditingRef.current = false;
      updateTranslationResult();
    }, 100);
  };

  const addSubtitle = () => {
    const lastSubtitle = editedSubtitles[editedSubtitles.length - 1];
    const newIndex = lastSubtitle ? lastSubtitle.index + 1 : 1;
    const newStart = lastSubtitle ? lastSubtitle.end : '00:00:00,000';
    isEditingRef.current = true;
    setEditedSubtitles((prev) => [...prev, { index: newIndex, start: newStart, end: newStart, text: '', style: 'Default' }]);
    setTimeout(() => {
      isEditingRef.current = false;
      updateTranslationResult();
    }, 100);
  };

  const removeSubtitle = (index) => {
    isEditingRef.current = true;
    setEditedSubtitles((prev) => prev.filter((_, i) => i !== index));
    setTimeout(() => {
      isEditingRef.current = false;
      updateTranslationResult();
    }, 100);
  };

  const handleSearchAndReplace = () => {
    if (!searchTerm.trim()) {
      alert(t('errorEmptySearch'));
      return;
    }
    isEditingRef.current = true;
    setEditedSubtitles((prev) => {
      const newSubtitles = [...prev];
      newSubtitles.forEach((sub) => {
        if (sub.text.includes(searchTerm)) sub.text = sub.text.replaceAll(searchTerm, replaceTerm);
      });
      return newSubtitles;
    });
    setTimeout(() => {
      isEditingRef.current = false;
      updateTranslationResult();
    }, 100);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      alert('Please enter your message!');
      return;
    }
    window.location.href = `mailto:Altonomega.mashani@protonmail.com?subject=Message%20from%20Website&body=${encodeURIComponent(
      contactMessage
    )}`;
    setContactMessage('');
    setIsContactOpen(false);
  };

  return (
    <AdvancedSubtitleGeneratorUI
      t={t}
      i18n={i18n}
      file={file}
      setFile={setFile}
      targetLang={targetLang}
      setTargetLang={setTargetLang}
      showLangDropdown={showLangDropdown}
      setShowLangDropdown={setShowLangDropdown}
      showSiteLangDropdown={showSiteLangDropdown}
      setShowSiteLangDropdown={setShowSiteLangDropdown}
      selectedModel={selectedModel}
      setSelectedModel={setSelectedModel}
      apiKeys={apiKeys}
      setApiKeys={setApiKeys}
      apiStatus={apiStatus}
      setApiStatus={setApiStatus}
      apiGroups={apiGroups}
      topic={topic}
      setTopic={setTopic}
      customPrompt={customPrompt}
      setCustomPrompt={setCustomPrompt}
      useCustomPrompt={useCustomPrompt}
      setUseCustomPrompt={setUseCustomPrompt}
      useCustomTemperature={useCustomTemperature}
      setUseCustomTemperature={setUseCustomTemperature}
      temperature={temperature}
      setTemperature={setTemperature}
      translation={translation}
      setTranslation={setTranslation}
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
      isGuideOpen={isGuideOpen}
      setIsGuideOpen={setIsGuideOpen}
      isContactOpen={isContactOpen}
      setIsContactOpen={setIsContactOpen}
      contactMessage={contactMessage}
      setContactMessage={setContactMessage}
      encryptionKeys={encryptionKeys}
      isEncryptionReady={isEncryptionReady}
      isOfflineMode={isOfflineMode}
      models={models}
      handleTranslate={handleTranslate}
      updateApiKey={updateApiKey}
      addApiKeyField={addApiKeyField}
      removeApiKeyField={removeApiKeyField}
      getApiStatusDisplay={getApiStatusDisplay}
      handleSearchAndReplace={handleSearchAndReplace}
      handleSendMessage={handleSendMessage}
      updateSubtitle={updateSubtitle}
      addSubtitle={addSubtitle}
      removeSubtitle={removeSubtitle}
      downloadFile={downloadFile}
      chunkSize={chunkSize}
      setChunkSize={setChunkSize}
      clearCache={clearCache}
    />
  );
};

export default AdvancedSubtitleGenerator;
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeInput, stripAssTags, parseAssTags, blocksToString } from './helpers';

const SubtitleEditor = ({
  translation,
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
  handleSearchAndReplace,
  updateSubtitle,
  addSubtitle,
  removeSubtitle,
  downloadFile,
  targetLang,
  file,
  theme,
}) => {
  const { t, i18n } = useTranslation();
  const [localSubtitles, setLocalSubtitles] = useState([]);
  const [invalidTimes, setInvalidTimes] = useState(new Set());
  const isSrt = file?.name?.split('.').pop().toLowerCase() === 'srt';

  useEffect(() => {
    console.log('Syncing localSubtitles with editedSubtitles:', {
      editedSubtitles: editedSubtitles.slice(0, 5),
      total: editedSubtitles.length,
    });
    const initializedSubtitles = editedSubtitles.map((sub, index) => {
      const cleanText = stripAssTags(sub.text || '').replace(/\\N/g, '\n');
      const parsedText = isSrt ? [{ type: 'text', value: cleanText }] : parseAssTags(sub.text || '');
      const lineTags = isSrt
        ? []
        : sub.lineTags ||
          parsedText.filter((p) =>
            p.type === 'tag' &&
            ['\\pos', '\\move', '\\clip', '\\iclip', '\\org', '\\fad', '\\fade', '\\an'].some((t) =>
              p.value.includes(t)
            )
          );
      return {
        ...sub,
        cleanText,
        parsedText,
        lineTags,
        index: sub.index || index + 1,
        timing: sub.timing || `${sub.start} --> ${sub.end}`,
      };
    });
    setLocalSubtitles(initializedSubtitles);
  }, [editedSubtitles, isSrt]);

  const validateTimeFormat = useCallback((time) => {
    const timeRegex = /^(\d+):(\d{2}):(\d{2})[,.]\d{2,3}$/;
    const isValid = timeRegex.test(time.trim());
    console.log('Validating time format:', { time, isValid });
    return isValid;
  }, []);

  const handleTextChange = useCallback(
    (index, value) => {
      const sanitizedText = sanitizeInput(value).replace(/\s+$/gm, '');
      if (!sanitizedText && !isSrt) {
        console.warn('Empty text for ASS subtitle, skipping update:', { index, value });
        alert(t('emptyTextNotAllowed'));
        return;
      }
      console.log('Handling text change:', { index, value: sanitizedText.slice(0, 200) });
      setLocalSubtitles((prev) => {
        const newSubtitles = [...prev];
        const subtitle = newSubtitles[index];
        subtitle.cleanText = sanitizedText;
        const lineTags = isSrt ? '' : subtitle.lineTags ? subtitle.lineTags.map((t) => t.value).join('') : '';
        subtitle.text = isSrt ? sanitizedText : lineTags + sanitizedText.replace(/\n/g, '\\N');
        subtitle.parsedText = isSrt ? [{ type: 'text', value: sanitizedText }] : parseAssTags(subtitle.text);
        return newSubtitles;
      });
      const lineTags = isSrt ? '' : localSubtitles[index]?.lineTags ? localSubtitles[index].lineTags.map((t) => t.value).join('') : '';
      const newText = isSrt ? sanitizedText : lineTags + sanitizedText.replace(/\n/g, '\\N');
      updateSubtitle(index, 'text', newText);
      console.log('Updated subtitle text:', { index, newText: newText.slice(0, 200) });
    },
    [updateSubtitle, localSubtitles, isSrt, t]
  );

  const handleTimeChange = useCallback(
    (index, field, value) => {
      if (!validateTimeFormat(value)) {
        console.warn('Invalid time format:', { field, value });
        setInvalidTimes((prev) => new Set(prev).add(`${index}-${field}`));
        alert(t('invalidTimeFormat'));
        return;
      }
      setInvalidTimes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${index}-${field}`);
        return newSet;
      });
      console.log('Handling time change:', { index, field, value });
      setLocalSubtitles((prev) => {
        const newSubtitles = [...prev];
        newSubtitles[index] = { ...newSubtitles[index], [field]: value };
        newSubtitles[index].timing = field === 'start' ? `${value} --> ${newSubtitles[index].end}` : `${newSubtitles[index].start} --> ${value}`;
        return newSubtitles;
      });
      updateSubtitle(index, field, value);
      updateSubtitle(index, 'timing', field === 'start' ? `${value} --> ${localSubtitles[index]?.end}` : `${localSubtitles[index]?.start} --> ${value}`);
      console.log('Updated subtitle time:', { index, field, value });
    },
    [updateSubtitle, localSubtitles, t, validateTimeFormat]
  );

  const filteredSubtitles = useMemo(() => {
    const filtered = localSubtitles.filter((sub) =>
      sub.cleanText.toLowerCase().includes(searchText.toLowerCase())
    );
    console.log('Filtered subtitles:', { searchText, count: filtered.length });
    return filtered;
  }, [localSubtitles, searchText]);

  const handleDownload = useCallback(() => {
    if (!file || !translation.result) {
      console.warn('Cannot download: missing file or translation result', { file, translationResult: translation.result });
      alert(t('noSubtitlesToDownload'));
      return;
    }
    if (invalidTimes.size > 0) {
      console.warn('Cannot download: invalid time formats detected', { invalidTimes });
      alert(t('errorInvalidTimes'));
      return;
    }
    console.log('Downloading subtitles:', { format: file.name.split('.').pop(), subtitles: editedSubtitles.slice(0, 5) });
    const outputFormat = file.name.split('.').pop().toLowerCase();
    const finalText = blocksToString(editedSubtitles, outputFormat, {
      scriptInfo: translation.parsedData?.scriptInfo || '',
      styles: translation.parsedData?.styles || '',
    });
    downloadFile(finalText, `translated_subtitle.${outputFormat}`);
  }, [translation.result, translation.parsedData, file, editedSubtitles, downloadFile, t, invalidTimes]);

  return (
    <div className="card p-8 shadow-lg rounded-xl bg-white dark:bg-gray-800">
      <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-5 text-center">
        {t('resultTitle')}
      </h3>
      {translation.result ? (
        <div className="flex flex-col h-full">
          <div className="mb-5 flex flex-col sm:flex-row items-center gap-4">
            <input
              value={searchText}
              onChange={(e) => {
                const value = sanitizeInput(e.target.value);
                console.log('Search text changed:', { value });
                setSearchText(value);
              }}
              placeholder={t('searchSubtitles')}
              className="flex-1 p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out text-center hover:scale-[1.01] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
            />
            <button
              onClick={() => {
                console.log('Toggling search and replace:', { showSearchReplace: !showSearchReplace });
                setShowSearchReplace(!showSearchReplace);
              }}
              className="py-3 px-6 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-400 ease-in-out hover:scale-105"
            >
              {showSearchReplace ? t('hide') : t('searchAndReplace')}
            </button>
          </div>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showSearchReplace ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {showSearchReplace && (
              <div className="mb-5 p-5 rounded-xl bg-gray-50 dark:bg-gray-700">
                <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-4 text-center">
                  {t('searchAndReplace')}
                </h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <input
                    value={searchTerm}
                    onChange={(e) => {
                      const value = sanitizeInput(e.target.value);
                      console.log('Search term changed:', { value });
                      setSearchTerm(value);
                    }}
                    placeholder={t('search')}
                    className="flex-1 min-w-[180px] p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out text-center hover:scale-[1.01] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  />
                  <input
                    value={replaceTerm}
                    onChange={(e) => {
                      const value = sanitizeInput(e.target.value);
                      console.log('Replace term changed:', { value });
                      setReplaceTerm(value);
                    }}
                    placeholder={t('replaceWith')}
                    className="flex-1 min-w-[180px] p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out text-center hover:scale-[1.01] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                  />
                  <button
                    onClick={() => {
                      console.log('Applying search and replace:', { searchTerm, replaceTerm });
                      handleSearchAndReplace();
                    }}
                    className="py-3 px-6 bg-[#34d399] text-white rounded-xl hover:bg-[#22c55e] transition-all duration-400 ease-in-out hover:scale-105"
                  >
                    {t('apply')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto mb-5 space-y-4">
            {filteredSubtitles.length > 0 ? (
              filteredSubtitles.map((sub, index) => (
                <div
                  key={`${sub.index}-${sub.start}-${sub.end}`}
                  className={`flex flex-col gap-4 p-5 rounded-xl border transition-all duration-300 ease-in-out hover:shadow-md ${
                    sub.cleanText.toLowerCase().includes(searchText.toLowerCase()) && searchText
                      ? 'bg-[#ecfdf5] border-[#34d399]'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd]">
                      {t('line', { index: sub.index })}
                    </span>
                    <button
                      onClick={() => {
                        console.log('Removing subtitle:', { index, subtitle: sub });
                        removeSubtitle(index);
                      }}
                      className="text-[#ef4444] hover:text-[#dc2626] font-medium transition-all duration-400 ease-in-out hover:scale-105"
                    >
                      {t('delete')}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <input
                      value={sub.start}
                      onChange={(e) => handleTimeChange(index, 'start', e.target.value)}
                      placeholder={t('start')}
                      className={`w-full sm:w-32 p-3 rounded-lg border outline-none transition-all duration-400 ease-in-out text-center hover:scale-[1.01] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                        invalidTimes.has(`${index}-start`)
                          ? 'border-[#ef4444] focus:border-[#ef4444]'
                          : 'border-gray-200 focus:border-[#60a5fa]'
                      }`}
                    />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd]">
                      →
                    </span>
                    <input
                      value={sub.end}
                      onChange={(e) => handleTimeChange(index, 'end', e.target.value)}
                      placeholder={t('end')}
                      className={`w-full sm:w-32 p-3 rounded-lg border outline-none transition-all duration-400 ease-in-out text-center hover:scale-[1.01] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                        invalidTimes.has(`${index}-end`)
                          ? 'border-[#ef4444] focus:border-[#ef4444]'
                          : 'border-gray-200 focus:border-[#60a5fa]'
                      }`}
                    />
                  </div>
                  {!isSrt && sub.lineTags?.length > 0 && (
                    <div className="p-2 rounded-md text-sm text-center bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200">
                      {t('tags')}: {sub.lineTags.map((t) => t.value).join(' ')}
                    </div>
                  )}
                  <textarea
                    value={sub.cleanText}
                    onChange={(e) => handleTextChange(index, e.target.value)}
                    className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:border-[#60a5fa] transition-all duration-400 ease-in-out resize-y text-center hover:scale-[1.01] bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    style={{ minHeight: '80px', lineHeight: '1.5', fontFamily: i18n.language === 'fa' ? 'Vazir, Arial' : 'Arial' }}
                    dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}
                    placeholder={t('enterSubtitleText')}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                {t('noResults')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                console.log('Adding new subtitle');
                addSubtitle();
              }}
              className="py-3 px-6 bg-[#34d399] text-white rounded-xl hover:bg-[#22c55e] transition-all duration-400 ease-in-out hover:scale-105 flex items-center gap-2"
              disabled={invalidTimes.size > 0}
            >
              {t('addNewLine')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              className="py-3 px-6 bg-[#34d399] text-white rounded-xl hover:bg-[#22c55e] transition-all duration-400 ease-in-out hover:scale-105 flex items-center gap-2"
              disabled={invalidTimes.size > 0}
            >
              {t('download')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 rounded-xl bg-gray-50 dark:bg-gray-700">
          <p className="text-lg text-center text-gray-500 dark:text-gray-400">
            {t('resultPlaceholder')}
          </p>
        </div>
      )}
      {translation.partialResult && (
        <div className="mt-5 p-5 rounded-xl bg-gray-50 dark:bg-gray-700">
          <h4 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] dark:from-[#60a5fa] dark:to-[#93c5fd] mb-3 text-center">
            {t('preview')}
          </h4>
          <pre className="whitespace-pre-wrap text-base text-center text-gray-800 dark:text-gray-100">
            {translation.partialResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SubtitleEditor;
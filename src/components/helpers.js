import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import { GoogleGenerativeAI } from '@google/generative-ai';

// کش کردن ترجمه
export const cacheTranslation = (key, result) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(key, JSON.stringify(result));
    console.log('Cached translation:', { key, result: result.slice(0, 200) });
  }
};

export const getCachedTranslation = (key) => {
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(key);
    console.log('Retrieved cached translation:', { key, cached: cached ? cached.slice(0, 200) : null });
    return cached ? JSON.parse(cached) : null;
  }
  return null;
};

export const clearCache = () => {
  console.log('clearCache function called');
  if (typeof window !== 'undefined') {
    console.log('Window is defined, checking sessionStorage...');
    console.log('Before clearing sessionStorage:', sessionStorage);
    sessionStorage.clear();
    console.log('After clearing sessionStorage:', sessionStorage);
    console.log('Cache cleared');
    alert('Cache cleared successfully!');
  } else {
    console.log('Window is not defined, likely running on server-side');
    alert('Cache is disabled, nothing to clear.');
  }
};

// پارس کردن فایل زیرنویس
export const parseSubtitle = (text, fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  console.log('Parsing subtitle:', { extension, text: text.slice(0, 200) });
  console.log('Selected parser:', extension === 'srt' ? 'parseSrt' : extension === 'vtt' ? 'parseVtt' : 'parseAss');
  switch (extension) {
    case 'srt':
      return parseSrt(text);
    case 'vtt':
      return parseVtt(text);
    case 'ass':
    case 'ssa':
      return parseAss(text);
    case 'sub':
      return parseSub(text);
    case 'ttml':
      return parseTtml(text);
    case 'smi':
      return parseSmi(text);
    default:
      throw new Error(`Unsupported subtitle format: ${extension}`);
  }
};

// پارس کردن تگ‌های ASS
export const parseAssTags = (text) => {
  if (!text) return [{ type: 'text', value: '' }];
  console.log('Parsing ASS tags:', { text: text.slice(0, 200) });
  const parts = [];
  let currentText = '';
  let i = 0;
  const seenTags = new Set();

  while (i < text.length) {
    if (text[i] === '{') {
      if (currentText) {
        parts.push({ type: 'text', value: currentText });
        currentText = '';
      }
      let tag = '';
      i++;
      let j = i;
      while (j < text.length && text[j] !== '}') {
        j++;
      }
      if (j < text.length) {
        tag = text.slice(i, j);
        const validTagRegex = /^{\\[a-zA-Z0-9]+(?:\([^)]*\)|[0-9a-zA-Z&,. ]*)?}$/;
        if (validTagRegex.test(`{${tag}}`)) {
          const tagType = tag.match(/^\\([a-zA-Z0-9]+)/)?.[1];
          const tagKey = `{${tag}}`;
          if (!seenTags.has(tagType)) {
            parts.push({ type: 'tag', value: tagKey });
            seenTags.add(tagType);
          }
        } else {
          parts.push({ type: 'text', value: `{${tag}}` });
        }
        i = j + 1;
      } else {
        currentText += '{' + text.slice(i);
        i = text.length;
      }
    } else {
      currentText += text[i];
      i++;
    }
  }
  if (currentText) parts.push({ type: 'text', value: currentText });
  console.log('Parsed ASS tags:', parts);
  return parts;
};

// حذف تمام تگ‌های ASS برای نمایش متن خام
export const stripAssTags = (text) => {
  if (!text) return '';
  const tagRegex = /({[^}]+})/g;
  const result = text
    .replace(tagRegex, '')
    .replace(/\\N/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
  console.log('Stripped ASS tags:', { input: text.slice(0, 200), output: result.slice(0, 200) });
  return result;
};

// پارس کردن فایل SRT
export const parseSrt = (text) => {
  console.log('Parsing SRT:', text.slice(0, 200));
  const lines = text.split('\n');
  const subtitles = [];
  let currentSubtitle = null;
  let expectingTiming = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line && currentSubtitle) {
      if (currentSubtitle.start && currentSubtitle.end) {
        subtitles.push(currentSubtitle);
      }
      currentSubtitle = null;
      expectingTiming = false;
      continue;
    }

    if (!currentSubtitle && !isNaN(parseInt(line))) {
      currentSubtitle = { index: parseInt(line), start: '', end: '', text: '', style: 'Default', timing: '' };
      expectingTiming = true;
      continue;
    }

    if (currentSubtitle && expectingTiming && line.includes('-->')) {
      const [start, end] = line.split(' --> ').map((time) => time.trim());
      currentSubtitle.start = start;
      currentSubtitle.end = end;
      currentSubtitle.timing = `${start} --> ${end}`;
      expectingTiming = false;
      continue;
    }

    if (currentSubtitle && !expectingTiming) {
      if (!currentSubtitle.text) {
        currentSubtitle.text = line;
      } else {
        currentSubtitle.text += '\n' + line;
      }
    }
  }

  if (currentSubtitle && currentSubtitle.start && currentSubtitle.end) {
    subtitles.push(currentSubtitle);
  }

  console.log('Parsed SRT subtitles:', subtitles);
  return subtitles;
};

// پارس کردن فایل WebVTT
export const parseVtt = (text) => {
  console.log('Parsing VTT:', text.slice(0, 200));
  const lines = text.split('\n');
  const subtitles = [];
  let currentSubtitle = null;
  let index = 1;

  if (lines[0].trim() !== 'WEBVTT') {
    throw new Error('Invalid WebVTT file');
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line && currentSubtitle) {
      if (currentSubtitle.start && currentSubtitle.end) {
        subtitles.push(currentSubtitle);
      }
      currentSubtitle = null;
      continue;
    }

    if (line.includes('-->')) {
      currentSubtitle = { index: index++, start: '', end: '', text: '', style: 'Default', timing: line };
      const [start, end] = line.split(' --> ').map((time) => time.trim());
      currentSubtitle.start = start;
      currentSubtitle.end = end;
      continue;
    }

    if (currentSubtitle) {
      if (!currentSubtitle.text) {
        currentSubtitle.text = line;
      } else {
        currentSubtitle.text += '\n' + line;
      }
    }
  }

  if (currentSubtitle && currentSubtitle.start && currentSubtitle.end) {
    subtitles.push(currentSubtitle);
  }

  console.log('Parsed VTT subtitles:', subtitles);
  return subtitles;
};

// پارس کردن فایل ASS/SSA
export const parseAss = (text) => {
  console.log('Parsing ASS:', text.slice(0, 200));
  const lines = text.split('\n');
  const subtitles = [];
  let inScriptInfo = false;
  let inStyles = false;
  let inDialogueSection = false;
  let index = 1;
  let scriptInfoLines = [];
  let styleLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[Script Info]') {
      inScriptInfo = true;
      scriptInfoLines.push(line);
      continue;
    }
    if (inScriptInfo && trimmed.startsWith('[') && trimmed !== '[Script Info]') {
      inScriptInfo = false;
    }
    if (inScriptInfo) {
      scriptInfoLines.push(line);
      continue;
    }

    if (trimmed === '[V4+ Styles]') {
      inStyles = true;
      styleLines.push(line);
      continue;
    }
    if (inStyles && trimmed.startsWith('[') && trimmed !== '[V4+ Styles]') {
      inStyles = false;
    }
    if (inStyles) {
      styleLines.push(line);
      continue;
    }

    if (trimmed === '[Events]') {
      inDialogueSection = true;
      continue;
    }
    if (inDialogueSection && trimmed.startsWith('Dialogue:')) {
      const parts = trimmed.split(',').map((part) => part.trim());
      if (parts.length >= 10) {
        const start = parts[1];
        const end = parts[2];
        const style = parts[3];
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n');
        const parsedText = parseAssTags(text);
        const lineTags = parsedText.filter((p) =>
          p.type === 'tag' && ['\\pos', '\\move', '\\clip', '\\iclip', '\\org', '\\fad', '\\fade', '\\an'].some((t) =>
            p.value.includes(t)
          )
        );
        const uniqueLineTags = [];
        const seenTypes = new Set();
        for (const tag of lineTags) {
          const tagType = tag.value.match(/^{\\([a-zA-Z0-9]+)/)?.[1];
          if (tagType && !seenTypes.has(tagType)) {
            uniqueLineTags.push(tag);
            seenTypes.add(tagType);
          }
        }
        subtitles.push({
          index: index++,
          start,
          end,
          style,
          text,
          parsedText,
          lineTags: uniqueLineTags,
          timing: `${start} --> ${end}`,
        });
      }
    }
  }

  console.log('Parsed ASS subtitles:', { subtitles, scriptInfo: scriptInfoLines.join('\n').slice(0, 200), styles: styleLines.join('\n').slice(0, 200) });
  return {
    subtitles,
    scriptInfo: scriptInfoLines.join('\n'),
    styles: styleLines.join('\n'),
  };
};

// پارس کردن فایل SUB
export const parseSub = (text) => {
  console.log('Parsing SUB:', text.slice(0, 200));
  const lines = text.split('\n');
  const subtitles = [];
  let index = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/{(\d+)}{(\d+)}(.*)/);
    if (match) {
      const startFrame = parseInt(match[1]);
      const endFrame = parseInt(match[2]);
      const text = match[3].replace('|', '\n');
      const start = framesToTime(startFrame, 24);
      const end = framesToTime(endFrame, 24);
      subtitles.push({
        index: index++,
        start,
        end,
        text,
        style: 'Default',
        timing: `${start} --> ${end}`,
      });
    }
  }

  console.log('Parsed SUB subtitles:', subtitles);
  return subtitles;
};

// پارس کردن فایل TTML
export const parseTtml = (text) => {
  console.log('Parsing TTML:', text.slice(0, 200));
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const subtitles = [];
  let index = 1;

  const pElements = xmlDoc.getElementsByTagName('p');
  for (const p of pElements) {
    const begin = p.getAttribute('begin');
    const end = p.getAttribute('end');
    const text = p.textContent.trim();
    if (begin && end && text) {
      subtitles.push({
        index: index++,
        start: begin,
        end,
        text,
        style: 'Default',
        timing: `${begin} --> ${end}`,
      });
    }
  }

  console.log('Parsed TTML subtitles:', subtitles);
  return subtitles;
};

// پارس کردن فایل SMI
export const parseSmi = (text) => {
  console.log('Parsing SMI:', text.slice(0, 200));
  const parser = new DOMParser();
  const htmlDoc = parser.parseFromString(text, 'text/html');
  const subtitles = [];
  let index = 1;

  const syncElements = htmlDoc.getElementsByTagName('sync');
  for (const sync of syncElements) {
    const start = sync.getAttribute('start');
    const nextSync = sync.nextElementSibling;
    const end = nextSync ? nextSync.getAttribute('start') : null;
    const text = sync.textContent.trim();
    if (start && end && text) {
      const startTime = msToTime(parseInt(start));
      const endTime = msToTime(parseInt(end));
      subtitles.push({
        index: index++,
        start: startTime,
        end: endTime,
        text,
        style: 'Default',
        timing: `${startTime} --> ${endTime}`,
      });
    }
  }

  console.log('Parsed SMI subtitles:', subtitles);
  return subtitles;
};

// تبدیل فریم به زمان
const framesToTime = (frames, fps) => {
  const totalSeconds = frames / fps;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  console.log('Converted frames to time:', { frames, fps, time });
  return time;
};

// تبدیل میلی‌ثانیه به زمان
const msToTime = (ms) => {
  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  console.log('Converted ms to time:', { ms, time });
  return time;
};

// تمیز کردن متن ترجمه‌شده
export const cleanTranslatedText = (text) => {
  if (!text) return '';
  let cleaned = text
    .replace(/,{2,}/g, ',')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  const tagRegex = /({[^}]+})/g;
  const tags = cleaned.match(tagRegex) || [];
  const seenTags = new Set();
  const uniqueTags = [];
  tags.forEach((tag) => {
    const tagType = tag.match(/^{\\([a-zA-Z0-9]+)/)?.[1];
    if (tagType && !seenTags.has(tagType)) {
      seenTags.add(tagType);
      uniqueTags.push(tag);
    }
  });

  let currentText = cleaned;
  let result = '';
  let lastIndex = 0;
  tags.forEach((tag) => {
    const tagType = tag.match(/^{\\([a-zA-Z0-9]+)/)?.[1];
    const index = currentText.indexOf(tag, lastIndex);
    if (index !== -1) {
      result += currentText.slice(lastIndex, index);
      if (seenTags.has(tagType) && uniqueTags.includes(tag)) {
        result += tag;
      }
      lastIndex = index + tag.length;
    }
  });
  result += currentText.slice(lastIndex);

  cleaned = result || cleaned;
  console.log('Cleaned translated text:', { input: text.slice(0, 200), output: cleaned.slice(0, 200) });
  return cleaned;
};

// تبدیل بلاک‌ها به رشته
export const blocksToString = (blocks, format = 'srt', parsedData = {}) => {
  console.log('blocksToString called:', { format, blocks: blocks.slice(0, 5), parsedData });

  const validateTime = (time) => {
    if (!time) return false;
    const timeRegex = /^(\d+):(\d{2}):(\d{2})[,.:](\d{2,3})$|^(\d+):(\d{2})[,.:](\d{2,3})$/;
    return timeRegex.test(time.trim());
  };

  const removeDuplicateTags = (text, lineTags) => {
    const allTags = [];
    if (lineTags) {
      lineTags.forEach((tag) => allTags.push(tag.value));
    }
    if (text) {
      const parsed = parseAssTags(text);
      parsed.forEach((part) => {
        if (part.type === 'tag') allTags.push(part.value);
      });
    }
    const seenTypes = new Set();
    const uniqueTags = [];
    allTags.forEach((tag) => {
      const tagType = tag.match(/^{\\([a-zA-Z0-9]+)/)?.[1];
      if (tagType && !seenTypes.has(tagType)) {
        seenTypes.add(tagType);
        uniqueTags.push(tag);
      }
    });
    return uniqueTags;
  };

  switch (format.toLowerCase()) {
    case 'srt': {
      const output = blocks
        .map((block) => {
          if (!block || !validateTime(block.start) || !validateTime(block.end)) {
            console.warn('Skipping invalid SRT block:', block);
            return '';
          }
          const text = block.text ? block.text.trim().split('\n').filter((line) => line.trim() !== '').join('\n') : '';
          if (!text) {
            console.warn('Skipping empty SRT text block:', block);
            return '';
          }
          return `${block.index}\n${block.start} --> ${block.end}\n${text}\n`;
        })
        .filter((block) => block !== '')
        .join('\n')
        .trim();
      console.log('Generated SRT output:', output.slice(0, 200));
      return output;
    }

    case 'vtt': {
      const formatTime = (time) => {
        if (!time || !validateTime(time)) {
          console.warn('Invalid time, returning default:', time);
          return '00:00:00.000';
        }
        let cleanTime = time.replace(',', '.').trim();
        const timeRegex = /^(\d+):(\d{2}):(\d{2})\.(\d{2,3})$|^(\d+):(\d{2})\.(\d{2,3})$/;
        const match = cleanTime.match(timeRegex);
        if (!match) {
          console.warn('Invalid time format, returning default:', cleanTime);
          return '00:00:00.000';
        }

        let hours = '00';
        let minutes, seconds, milliseconds;

        if (match[1]) {
          hours = match[1].padStart(2, '0');
          minutes = match[2].padStart(2, '0');
          seconds = match[3].padStart(2, '0');
          milliseconds = match[4].padStart(3, '0');
        } else {
          minutes = match[5].padStart(2, '0');
          seconds = match[6].padStart(2, '0');
          milliseconds = match[7].padStart(3, '0');
        }

        const formatted = `${hours}:${minutes}:${seconds}.${milliseconds}`;
        console.log('Formatted time for VTT:', { input: time, output: formatted });
        return formatted;
      };

      const convertAssTagsToHtml = (text) => {
        if (!text) {
          console.warn('No text to convert:', text);
          return '';
        }
        const parsed = parseAssTags(text);
        let result = '';
        const openTags = { b: false, i: false, u: false, s: false, span: [] };

        parsed.forEach((part, idx) => {
          console.log('Processing ASS tag part:', { index: idx, part });
          if (part.type === 'text') {
            result += part.value.replace(/\\N/g, '<br>');
          } else if (part.type === 'tag') {
            const tag = part.value;
            if (tag === '{\\b1}') {
              if (!openTags.b) {
                result += '<b>';
                openTags.b = true;
              }
            } else if (tag === '{\\b0}') {
              if (openTags.b) {
                result += '</b>';
                openTags.b = false;
              }
            } else if (tag === '{\\i1}') {
              if (!openTags.i) {
                result += '<i>';
                openTags.i = true;
              }
            } else if (tag === '{\\i0}') {
              if (openTags.i) {
                result += '</i>';
                openTags.i = false;
              }
            } else if (tag === '{\\u1}') {
              if (!openTags.u) {
                result += '<u>';
                openTags.u = true;
              }
            } else if (tag === '{\\u0}') {
              if (openTags.u) {
                result += '</u>';
                openTags.u = false;
              }
            } else if (tag === '{\\s1}') {
              if (!openTags.s) {
                result += '<s>';
                openTags.s = true;
              }
            } else if (tag === '{\\s0}') {
              if (openTags.s) {
                result += '</s>';
                openTags.s = false;
              }
            } else if (tag.match(/^{\\c&H([0-9A-F]{6})&}$/) || tag.match(/^{\\1c&H([0-9A-F]{6})&}$/)) {
              const bgr = tag.match(/[0-9A-F]{6}/)[0];
              const rgb = `#${bgr.slice(4, 6)}${bgr.slice(2, 4)}${bgr.slice(0, 2)}`;
              result += `<span style="color:${rgb};">`;
              openTags.span.push('color');
            } else if (tag.match(/^{\\fn([^}]+)}$/)) {
              const font = tag.match(/^{\\fn([^}]+)}$/)[1];
              result += `<span style="font-family:'${font}',sans-serif;">`;
              openTags.span.push('font');
            } else if (tag.match(/^{\\fs(\d+)}$/)) {
              const size = parseInt(tag.match(/^{\\fs(\d+)}$/)[1]);
              result += `<span style="font-size:${size}px;">`;
              openTags.span.push('size');
            } else if (tag.match(/^{\\an(\d)}$/)) {
              const align = parseInt(tag.match(/^{\\an(\d)}$/)[1]);
              let position = '';
              let verticalAlign = '';
              let top = '';
              let left = '';
              if (align === 1) {
                position = 'bottom-left';
                verticalAlign = 'bottom';
                top = 'bottom:10%';
                left = 'left:10%';
              } else if (align === 2) {
                position = 'bottom-center';
                verticalAlign = 'bottom';
                top = 'bottom:10%';
                left = 'left:50%;transform:translateX(-50%)';
              } else if (align === 3) {
                position = 'bottom-right';
                verticalAlign = 'bottom';
                top = 'bottom:10%';
                left = 'right:10%';
              } else if (align === 4) {
                position = 'middle-left';
                verticalAlign = 'middle';
                top = 'top:50%';
                left = 'left:10%';
              } else if (align === 5) {
                position = 'middle-center';
                verticalAlign = 'middle';
                top = 'top:50%';
                left = 'left:50%;transform:translateX(-50%)';
              } else if (align === 6) {
                position = 'middle-right';
                verticalAlign = 'middle';
                top = 'top:50%';
                left = 'right:10%';
              } else if (align === 7) {
                position = 'top-left';
                verticalAlign = 'top';
                top = 'top:10%';
                left = 'left:10%';
              } else if (align === 8) {
                position = 'top-center';
                verticalAlign = 'top';
                top = 'top:10%';
                left = 'left:50%;transform:translateX(-50%)';
              } else if (align === 9) {
                position = 'top-right';
                verticalAlign = 'top';
                top = 'top:10%';
                left = 'right:10%';
              }
              result += `<span style="display:block;text-align:${
                position.includes('center') ? 'center' : position.includes('right') ? 'right' : 'left'
              };vertical-align:${verticalAlign};position:absolute;${top};${left};width:${
                position.includes('center') ? '80%' : 'auto'
              };">`;
              openTags.span.push('align');
            } else if (tag.match(/^{\\pos\((\d+),(\d+)\)}$/)) {
              const [x, y] = tag.match(/^{\\pos\((\d+),(\d+)\)}$/).slice(1).map(Number);
              result += `<span style="position:absolute;left:${x}px;top:${y}px;">`;
              openTags.span.push('position');
            } else if (tag.match(/^{\\r}$/) || tag.match(/^{\\r[^}]+}$/)) {
              if (openTags.b) result += '</b>';
              if (openTags.i) result += '</i>';
              if (openTags.u) result += '</u>';
              if (openTags.s) result += '</s>';
              while (openTags.span.length) {
                result += '</span>';
                openTags.span.pop();
              }
              openTags.b = openTags.i = openTags.u = openTags.s = false;
            }
          }
        });

        if (openTags.b) result += '</b>';
        if (openTags.i) result += '</i>';
        if (openTags.u) result += '</u>';
        if (openTags.s) result += '</s>';
        while (openTags.span.length) {
          result += '</span>';
          openTags.span.pop();
        }

        const finalText = result.trim().split('\n').filter((line) => line.trim() !== '').join('\n');
        console.log('Converted ASS tags to HTML:', { input: text.slice(0, 200), output: finalText.slice(0, 200) });
        return finalText;
      };

      const isAssFormat = format.toLowerCase() === 'ass' || format.toLowerCase() === 'ssa';
      const isAss = isAssFormat && blocks.some((block) => block.lineTags?.length || block.parsedText);

      if (isAss) {
        const vttOutput = `WEBVTT\n\n${blocks
          .map((block, index) => {
            if (!block || !validateTime(block.start) || !validateTime(block.end) || !block.text) {
              console.warn('Skipping invalid ASS block:', block);
              return '';
            }
            const text = convertAssTagsToHtml(block.text);
            if (!text) {
              console.warn('Skipping empty ASS text block:', block);
              return '';
            }
            const start = formatTime(block.start);
            const end = formatTime(block.end);
            return `${index + 1}\n${start} --> ${end}\n${text}\n`;
          })
          .filter((block) => block !== '')
          .join('\n')}\n`.trim();
        console.log('Generated VTT output for ASS:', vttOutput.slice(0, 200));
        return vttOutput;
      } else {
        const vttOutput = `WEBVTT\n\n${blocks
          .map((block, index) => {
            if (!block || !validateTime(block.start) || !validateTime(block.end) || !block.text) {
              console.warn('Skipping invalid SRT block:', block);
              return '';
            }
            const text = block.text.trim().split('\n').filter((line) => line.trim() !== '').join('<br>');
            if (!text) {
              console.warn('Skipping empty SRT text block:', block);
              return '';
            }
            const start = formatTime(block.start);
            const end = formatTime(block.end);
            return `${index + 1}\n${start} --> ${end}\n${text}\n`;
          })
          .filter((block) => block !== '')
          .join('\n')}\n`.trim();
        console.log('Generated VTT output for SRT:', vttOutput.slice(0, 200));
        return vttOutput;
      }
    }

    case 'ass':
    case 'ssa': {
      const cleanSection = (section) => section.split('\n').filter((line) => line.trim() !== '').join('\n');

      const scriptInfo = cleanSection(parsedData.scriptInfo || '[Script Info]\nTitle: Translated Subtitles\nScriptType: v4.00+\n');
      const styles = cleanSection(
        parsedData.styles ||
          '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,16,&Hffffff,&Hffffff,&H0,&H0,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,0\n'
      );

      const events = blocks
        .map((block) => {
          if (!block || !validateTime(block.start) || !validateTime(block.end)) {
            console.warn('Skipping invalid ASS block:', block);
            return '';
          }
          const uniqueTags = removeDuplicateTags(block.text, block.lineTags);
          const lineTags = uniqueTags.join('');
          const textTags = block.parsedText
            ? block.parsedText.filter((part) => part.type === 'text').map((part) => part.value).join('')
            : block.text
            ? block.text.trim().replace(/\n/g, '\\N')
            : '';
          const text = lineTags + textTags;
          if (!text) {
            console.warn('Skipping empty ASS text block:', block);
            return '';
          }
          const style = block.style || 'Default';
          return `Dialogue: 0,${block.start},${block.end},${style},,0,0,0,,${text}`;
        })
        .filter((block) => block !== '')
        .join('\n');
      const assOutput = `${scriptInfo}\n${styles}\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${events}`.trim();
      console.log('Generated ASS output:', assOutput.slice(0, 200));
      return assOutput;
    }

    case 'sub': {
      const output = blocks
        .map((block) => {
          if (!block || !validateTime(block.start) || !validateTime(block.end)) {
            console.warn('Skipping invalid SUB block:', block);
            return '';
          }
          const text = block.text ? block.text.trim().replace(/\n/g, '|') : '';
          if (!text) {
            console.warn('Skipping empty SUB text block:', block);
            return '';
          }
          const startFrame = timeToFrames(block.start, 24);
          const endFrame = timeToFrames(block.end, 24);
          return `{${startFrame}}{${endFrame}}${text}`;
        })
        .filter((block) => block !== '')
        .join('\n')
        .trim();
      console.log('Generated SUB output:', output.slice(0, 200));
      return output;
    }

    case 'ttml': {
      const ttmlOutput = `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  <body>
    <div>
${blocks
  .map((block) => {
    if (!block || !validateTime(block.start) || !validateTime(block.end)) {
      console.warn('Skipping invalid TTML block:', block);
      return '';
    }
    const text = block.text ? block.text.trim().replace(/\n/g, '<br/>') : '';
    if (!text) {
      console.warn('Skipping empty TTML text block:', block);
      return '';
    }
    return `      <p begin="${block.start}" end="${block.end}">${text}</p>`;
  })
  .filter((block) => block !== '')
  .join('\n')}
    </div>
  </body>
</tt>`.trim();
      console.log('Generated TTML output:', ttmlOutput.slice(0, 200));
      return ttmlOutput;
    }

    case 'smi': {
      const smiOutput = `<SAMI>
<HEAD>
<STYLE TYPE="text/css">
<!--
P { margin-left: 8pt; margin-right: 8pt; margin-bottom: 2pt; margin-top: 2pt; }
-->
</STYLE>
</HEAD>
<BODY>
${blocks
  .map((block) => {
    if (!block || !validateTime(block.start) || !validateTime(block.end)) {
      console.warn('Skipping invalid SMI block:', block);
      return '';
    }
    const text = block.text ? block.text.trim() : '';
    if (!text) {
      console.warn('Skipping empty SMI text block:', block);
      return '';
    }
    const startMs = timeToMs(block.start);
    return `  <SYNC Start=${startMs}><P Class=ENCC>${text}</P></SYNC>`;
  })
  .filter((block) => block !== '')
  .join('\n')}
</BODY>
</SAMI>`.trim();
      console.log('Generated SMI output:', smiOutput.slice(0, 200));
      return smiOutput;
    }

    default:
      console.error('Unsupported format:', format);
      throw new Error(`Unsupported output format: ${format}`);
  }
};

// تبدیل زمان به فریم
const timeToFrames = (time, fps) => {
  if (!time) {
    console.warn('Invalid time for frame conversion:', time);
    return 0;
  }
  const parts = time.split(/[:,]/);
  if (parts.length < 3) {
    console.warn('Invalid time format for frame conversion:', time);
    return 0;
  }
  const [hours, minutes, seconds] = parts.map((val) => parseInt(val));
  const milliseconds = parseInt(parts[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  const frames = Math.round(totalSeconds * fps);
  console.log('Converted time to frames:', { time, fps, frames });
  return frames;
};

// تبدیل میلی‌ثانیه به زمان
const timeToMs = (time) => {
  const parts = time.split(/[:,]/);
  if (parts.length < 3) return 0;
  const [hours, minutes, seconds] = parts.map((val) => parseInt(val));
  const milliseconds = parseInt(parts[3] || '0');
  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
};

// تمیز کردن علائم نگارشی
export const cleanPunctuation = (text) => {
  const cleaned = text.replace(/\.\s*$/gm, '').trim();
  console.log('Cleaned punctuation:', { input: text.slice(0, 200), output: cleaned.slice(0, 200) });
  return cleaned;
};

// تأخیر
export const delay = (ms) => {
  console.log('Delaying for:', ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// تقسیم متن به تکه‌ها
export const splitTextIntoChunks = (text, maxLinesPerChunk = 30) => {
  const lines = text.split('\n');
  const chunks = [];
  for (let i = 0; i < lines.length; i += maxLinesPerChunk) {
    const chunk = lines.slice(i, i + maxLinesPerChunk).join('\n');
    chunks.push(chunk);
    console.log('Created chunk:', { index: i / maxLinesPerChunk, chunk: chunk.slice(0, 200) });
  }
  return chunks;
};

// دانلود فایل
export const downloadFile = (content, fileName) => {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    console.log('Downloading file:', { fileName, content: content.slice(0, 200) });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// پاک‌سازی ورودی
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    console.warn('Invalid input for sanitization:', input);
    return '';
  }
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[^\w\s\n\-\.\,\!\?\(\)\[\]\{\}\u0600-\u06FF]/g, '');
  console.log('Sanitized input:', { input: input.slice(0, 200), output: sanitized.slice(0, 200) });
  return sanitized;
};

// تولید کلیدهای رمزنگاری
export const generateEncryptionKeys = () => {
  console.log('Generating encryption keys');
  const aesKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  const aesIV = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  const rsaKeys = forge.pki.rsa.generateKeyPair(2048);
  const publicKey = forge.pki.publicKeyToPem(rsaKeys.publicKey);
  const privateKey = forge.pki.privateKeyToPem(rsaKeys.privateKey);
  const hmacKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  return { aesKey, aesIV, publicKey, privateKey, hmacKey };
};

// رمزنگاری چندلایه
export const multiLayerEncrypt = (data, aesKey, publicKey, hmacKey) => {
  try {
    console.log('Encrypting data:', { data: data.slice(0, 200) });
    const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const sanitizedData = sanitizeInput(data);
    const encryptedAES = CryptoJS.AES.encrypt(sanitizedData, CryptoJS.enc.Hex.parse(aesKey), {
      iv: CryptoJS.enc.Hex.parse(iv),
    }).toString();
    const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
    const encryptedRSA = publicKeyObj.encrypt(encryptedAES, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    const encryptedRSABase64 = forge.util.encode64(encryptedRSA);
    const hmac = CryptoJS.HmacSHA256(encryptedRSABase64 + iv, CryptoJS.enc.Hex.parse(hmacKey)).toString();
    console.log('Encryption successful:', { encryptedData: encryptedRSABase64.slice(0, 200), hmac, iv });
    return { encryptedData: encryptedRSABase64, hmac, iv };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data: ' + error.message);
  }
};

// رمزگشایی چندلایه
export const multiLayerDecrypt = (encryptedObj, aesKey, privateKey, hmacKey) => {
  try {
    if (
      !encryptedObj ||
      !encryptedObj.encryptedData ||
      !encryptedObj.hmac ||
      !encryptedObj.iv ||
      !encryptedObj.encryptedData.trim() ||
      !encryptedObj.hmac.trim() ||
      !encryptedObj.iv.trim()
    ) {
      console.error('Invalid encrypted object:', encryptedObj);
      return '';
    }
    const { encryptedData, hmac, iv } = encryptedObj;
    console.log('Decrypting data:', { encryptedData: encryptedData.slice(0, 200), hmac, iv });
    if (
      !encryptedData ||
      !hmac ||
      !iv ||
      !aesKey ||
      !hmacKey ||
      typeof aesKey !== 'string' ||
      typeof hmacKey !== 'string'
    ) {
      console.error('Missing encryption parameters');
      return '';
    }
    if (iv.length !== 32) {
      console.error('Invalid IV length:', iv);
      return '';
    }
    const computedHmac = CryptoJS.HmacSHA256(encryptedData + iv, CryptoJS.enc.Hex.parse(hmacKey)).toString();
    if (computedHmac !== hmac) {
      console.error('HMAC validation failed');
      return '';
    }
    const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
    if (!privateKeyObj) throw new Error('Invalid private key');
    const decryptedRSA = privateKeyObj.decrypt(forge.util.decode64(encryptedData), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: { md: forge.md.sha256.create() },
    });
    const decrypted = CryptoJS.AES.decrypt(decryptedRSA, CryptoJS.enc.Hex.parse(aesKey), {
      iv: CryptoJS.enc.Hex.parse(iv),
    }).toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      console.error('Decryption failed');
      return '';
    }
    console.log('Decryption successful:', { decrypted: decrypted.slice(0, 200) });
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '';
  }
};

// اعتبارسنجی فرمت کلید API
export const validateApiKeyFormat = (key) => {
  const apiKeyRegex = /^[A-Za-z0-9\-_]{20,50}$/;
  const isValid = apiKeyRegex.test(key);
  console.log('Validated API key format:', { key: key.slice(0, 10) + '...', isValid });
  return isValid;
};

// تلاش مجدد با تأخیر
export const retryWithDelay = async (fn, maxRetries = 10, delayMs = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log('Attempting retry:', { attempt: i + 1, maxRetries });
      return await fn();
    } catch (error) {
      console.error(`Retry ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw new Error('Max retries reached: ' + error.message);
      await delay(delayMs * (i + 1));
    }
  }
};

// بررسی آنلاین بودن
export const isOnline = () => {
  const online = navigator.onLine;
  console.log('Checking online status:', online);
  return online;
};

// تولید پرامپت برای ترجمه
export const getPromptForTranslation = (text, targetLang, topic = '', customPrompt = '') => {
  const sanitizedTopic = sanitizeInput(topic);
  const sanitizedText = sanitizeInput(text);
  console.log('Generating translation prompt:', { targetLang, topic: sanitizedTopic.slice(0, 50), text: sanitizedText.slice(0, 200) });

  if (customPrompt.trim()) {
    const sanitizedCustomPrompt = sanitizeInput(customPrompt);
    return `${sanitizedCustomPrompt}\n\n${sanitizedText}`;
  }

  const context = sanitizedTopic ? `The video is about ${sanitizedTopic}. ` : '';
  const prompt = `You are an expert subtitle translator with deep knowledge of conversational ${targetLang}. ${context}Translate the following video subtitle text into ${targetLang}. Ensure the translation is:
  - Fluent, natural, and conversational, as if spoken by a native ${targetLang} speaker in a movie or TV series.
  - Adjusted for colloquial expressions and idioms.
  - Grammatically correct and restructured for natural flow.
  - Preserving proper names, technical terms, and timing/formatting intact.
  - Each line translated separately with the same structure and line breaks.
  - Do not add extra characters like repeated commas, unnecessary spaces, or comments.
Only return the translated subtitles without explanations or extra text:\n\n${sanitizedText}`;
  console.log('Generated prompt:', prompt.slice(0, 200));
  return prompt;
};

// تولید پرامپت برای تشخیص زبان
export const getPromptForLanguageDetection = (text) => {
  const prompt = `Detect the language of the following text and return only the language code (e.g., "en", "fa"):\n\n${text.slice(0, 200)}`;
  console.log('Generated language detection prompt:', prompt.slice(0, 200));
  return prompt;
};

// ترجمه با Gemini API
export const translateWithGemini = async (
  text,
  targetLang,
  encryptedApiKey,
  encryptionKeys,
  topic,
  customPrompt = '',
  model = 'gemini-2.0-flash',
  temperature = 0.7
) => {
  if (!encryptionKeys) {
    throw new Error('Encryption keys not initialized');
  }
  const apiKey = multiLayerDecrypt(encryptedApiKey, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
  if (!apiKey || !validateApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key');
  }
  console.log('Translating with Gemini:', { model, targetLang, text: text.slice(0, 200), temperature });

  // تنظیم timeout بر اساس مدل
  const timeout = ['gemini-2.5-pro-exp-03-25', 'gemini-1.5-pro'].includes(model) ? 100000 : 30000; // 100 ثانیه برای مدل‌های مشخص‌شده، 30 ثانیه برای بقیه

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      generationConfig: { temperature, maxOutputTokens: 4000 },
    });
    const prompt = getPromptForTranslation(text, targetLang, topic, customPrompt);

    console.log(`Sending request to Gemini API at ${new Date().toISOString()} for model: ${model}`);

    const result = await Promise.race([
      geminiModel.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout)),
    ]);

    console.log(`Received response from Gemini API at ${new Date().toISOString()} for model: ${model}`);

    const translatedText = (await result.response).text();
    const cleanedText = cleanTranslatedText(cleanPunctuation(translatedText));
    console.log('Gemini translation result:', { input: text.slice(0, 200), output: cleanedText.slice(0, 200) });
    return cleanedText;
  } catch (error) {
    console.error('Gemini translation error:', error.message);
    if (error.message.includes('429')) throw new Error('Rate Limit reached');
    throw new Error(`Translation failed with ${model}: ${error.message}`);
  }
};

// ترجمه با Grok API
export const translateWithGrok = async (
  text,
  targetLang,
  encryptedApiKey,
  encryptionKeys,
  topic,
  customPrompt = '',
  timeout = 30000,
  temperature = 0.7
) => {
  if (!encryptionKeys) {
    throw new Error('Encryption keys not initialized');
  }
  const apiKey = multiLayerDecrypt(encryptedApiKey, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
  if (!apiKey || !validateApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key');
  }
  console.log('Translating with Grok:', { targetLang, text: text.slice(0, 200), temperature });
  try {
    const prompt = getPromptForTranslation(text, targetLang, topic, customPrompt);
    const response = await Promise.race([
      fetch('https://api.x.ai/v1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3-beta',
          messages: [{ role: 'user', content: prompt }],
          temperature,
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout)),
    ]);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || '';
    const cleanedText = cleanTranslatedText(cleanPunctuation(translatedText));
    console.log('Grok translation result:', { input: text.slice(0, 200), output: cleanedText.slice(0, 200) });
    return cleanedText;
  } catch (error) {
    console.error('Grok translation error:', error.message);
    if (error.message.includes('429')) throw new Error('Rate Limit reached');
    throw new Error('Translation failed: ' + error.message);
  }
};

// ترجمه با ChatGPT API
export const translateWithChatGPT = async (
  text,
  targetLang,
  encryptedApiKey,
  encryptionKeys,
  topic,
  customPrompt = '',
  timeout = 30000,
  temperature = 0.7
) => {
  if (!encryptionKeys) {
    throw new Error('Encryption keys not initialized');
  }
  const apiKey = multiLayerDecrypt(encryptedApiKey, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
  if (!apiKey || !validateApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key');
  }
  console.log('Translating with ChatGPT:', { targetLang, text: text.slice(0, 200), temperature });
  try {
    const prompt = getPromptForTranslation(text, targetLang, topic, customPrompt);
    const response = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature,
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout)),
    ]);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || '';
    const cleanedText = cleanTranslatedText(cleanPunctuation(translatedText));
    console.log('ChatGPT translation result:', { input: text.slice(0, 200), output: cleanedText.slice(0, 200) });
    return cleanedText;
  } catch (error) {
    console.error('ChatGPT translation error:', error.message);
    if (error.message.includes('429')) throw new Error('Rate Limit reached');
    throw new Error('Translation failed: ' + error.message);
  }
};

// ترجمه با DeepSeek API
export const translateWithDeepSeek = async (
  text,
  targetLang,
  encryptedApiKey,
  encryptionKeys,
  topic,
  customPrompt = '',
  timeout = 30000,
  temperature = 0.7
) => {
  if (!encryptionKeys) {
    throw new Error('Encryption keys not initialized');
  }
  const apiKey = multiLayerDecrypt(encryptedApiKey, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
  if (!apiKey || !validateApiKeyFormat(apiKey)) {
    throw new Error('Invalid API key');
  }
  console.log('Translating with DeepSeek:', { targetLang, text: text.slice(0, 200), temperature });
  try {
    const prompt = getPromptForTranslation(text, targetLang, topic, customPrompt);
    const response = await Promise.race([
      fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-r1',
          messages: [{ role: 'user', content: prompt }],
          temperature,
        }),
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeout)),
    ]);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content || '';
    const cleanedText = cleanTranslatedText(cleanPunctuation(translatedText));
    console.log('DeepSeek translation result:', { input: text.slice(0, 200), output: cleanedText.slice(0, 200) });
    return cleanedText;
  } catch (error) {
    console.error('DeepSeek translation error:', error.message);
    if (error.message.includes('429')) throw new Error('Rate Limit reached');
    throw new Error('Translation failed: ' + error.message);
  }
};

// تشخیص زبان با Gemini
export const detectLanguageWithGemini = async (text, apiKey, encryptionKeys) => {
  if (!encryptionKeys || !apiKey) {
    throw new Error('Encryption keys or API key not available');
  }
  const decryptedApiKey = multiLayerDecrypt(apiKey, encryptionKeys.aesKey, encryptionKeys.privateKey, encryptionKeys.hmacKey);
  if (!decryptedApiKey || !validateApiKeyFormat(decryptedApiKey)) {
    throw new Error('Invalid API key');
  }
  console.log('Detecting language with Gemini:', { text: text.slice(0, 200) });
  try {
    const genAI = new GoogleGenerativeAI(decryptedApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = getPromptForLanguageDetection(text);
    const result = await retryWithDelay(() =>
      Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 30000)),
      ])
    );
    const detectedLang = (await result.response).text();
    console.log('Detected language:', detectedLang);
    return detectedLang;
  } catch (error) {
    console.error('Language detection error:', error.message);
    throw new Error('Error detecting language with Gemini: ' + error.message);
  }
};
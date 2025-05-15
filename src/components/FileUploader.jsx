import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FileUploader = ({ file, setFile, theme }) => {
  const { t, i18n } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    const validTypes = ['text/plain', 'text/vtt', 'text/xml', 'application/x-subrip'];
    if (droppedFile && (validTypes.includes(droppedFile.type) || /\.(srt|vtt|ass|ssa|sub|ttml|smi)$/i.test(droppedFile.name))) {
      setFile(droppedFile);
    } else {
      alert(t('invalidFileType'));
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  return (
    <section>
      <div
        className={`p-8 border-2 border-dashed border-[#3b82f6] rounded-xl cursor-pointer flex flex-col items-center transition-all duration-400 ease-in-out hover:scale-[1.005] hover:shadow-xl ${
          isDragging ? 'border-[#34d399] bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] scale-105' : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900'
        } shadow-md`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileClick}
      >
        <p className={`text-lg font-medium text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}>
          {file ? file.name : t('uploadSubtitle')}
        </p>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile && /\.(srt|vtt|ass|ssa|sub|ttml|smi)$/i.test(selectedFile.name)) {
              setFile(selectedFile);
            } else {
              alert(t('invalidFileType'));
            }
          }}
          accept=".srt,.vtt,.ass,.ssa,.sub,.ttml,.smi"
        />
      </div>
    </section>
  );
};

export default FileUploader;
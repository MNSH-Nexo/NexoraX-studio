import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import VideoJS from 'video.js';
import 'video.js/dist/video-js.css';
import { blocksToString, parseSubtitle } from './helpers';

const VideoPlayer = ({ file, translation, targetLang, theme }) => {
  const { t } = useTranslation();
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleUrl, setSubtitleUrl] = useState(null);
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleVideoChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      console.log('Video file selected:', selectedFile.name);
      setVideoFile(selectedFile);
    } else {
      alert(t('invalidVideoFormat'));
    }
  };

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    console.log('Translation update:', { translation, file });
    if (translation?.result && file) {
      try {
        const outputFormat = file.name.split('.').pop().toLowerCase();
        const parsed = parseSubtitle(translation.result, file.name);
        const vttText = blocksToString(
          Array.isArray(parsed) ? parsed : parsed.subtitles || [],
          'vtt',
          Array.isArray(parsed) ? {} : parsed
        );
        console.log('VTT Output:', vttText);

        if (!vttText.startsWith('WEBVTT')) {
          console.error('Invalid VTT format:', vttText);
          return;
        }

        const blob = new Blob([vttText], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob) + `#t=${Date.now()}`;
        console.log('Subtitle URL created:', url);
        setSubtitleUrl(url);

        return () => {
          console.log('Revoking subtitle URL:', url);
          URL.revokeObjectURL(url.split('#')[0]);
        };
      } catch (error) {
        console.error('Error generating VTT:', error);
      }
    } else {
      console.log('No translation or file, resetting subtitleUrl');
      setSubtitleUrl(null);
    }
  }, [translation?.result, file]);

  useEffect(() => {
    if (!videoRef.current || !videoFile) {
      console.log('Skipping Video.js setup: videoRef or videoFile missing', { videoRef: !!videoRef.current, videoFile: !!videoFile });
      return;
    }

    if (playerRef.current) {
      console.log('Player already initialized, skipping setup');
      return;
    }

    console.log('Initializing Video.js player');
    const player = VideoJS(videoRef.current, {
      controls: true,
      responsive: true,
      fluid: true,
      playbackRates: [0.5, 1, 1.5, 2],
      sources: [{ src: URL.createObjectURL(videoFile), type: videoFile.type }],
      textTrackSettings: {
        backgroundColor: 'transparent',
        backgroundOpacity: '0.5',
        edgeStyle: 'raised',
      },
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        console.log('Disposing Video.js player');
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [videoFile]);

  useEffect(() => {
    if (!playerRef.current || !videoRef.current) {
      console.log('Skipping subtitle update: player or videoRef missing', { player: !!playerRef.current, videoRef: !!videoRef.current });
      return;
    }

    const player = playerRef.current;
    console.log('Updating subtitles:', { subtitleUrl, targetLang });

    const tracks = player.remoteTextTracks();
    for (let i = tracks.length - 1; i >= 0; i--) {
      console.log('Removing track:', tracks[i].src);
      player.removeRemoteTextTrack(tracks[i]);
    }

    if (subtitleUrl) {
      console.log('Adding new subtitle track:', subtitleUrl);
      const track = player.addRemoteTextTrack(
        {
          src: subtitleUrl,
          kind: 'subtitles',
          srclang: targetLang,
          label: targetLang,
          default: true,
        },
        false
      );

      track.track.mode = 'showing';
      console.log('Subtitle track activated:', track.track.label);

      const style = document.createElement('style');
      style.textContent = `
        .video-js .vjs-text-track-cue {
          font-family: Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          text-align: center;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 4px;
          padding: 5px 10px;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }
        .video-js .vjs-text-track-cue b { font-weight: bold; }
        .video-js .vjs-text-track-cue i { font-style: italic; }
        .video-js .vjs-text-track-cue u { text-decoration: underline; }
        .video-js .vjs-text-track-cue s { text-decoration: line-through; }
      `;
      document.head.appendChild(style);

      track.track.addEventListener('load', () => {
        console.log('Subtitle track loaded successfully:', track.track.label);
      });
      track.track.addEventListener('error', (e) => {
        console.error('Subtitle track load error:', e);
      });

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [subtitleUrl, targetLang]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <label className={`block text-lg font-medium text-center transition-all duration-300 ease-in-out hover:scale-[1.005] ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-100'
        }`}>
          {t('selectVideo')}
        </label>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleFileClick}
            className="flex items-center space-x-2 py-3 px-6 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white rounded-xl shadow-md transition-all duration-400 ease-in-out hover:scale-105 hover:from-[#2563eb] hover:to-[#3b82f6] hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>{t('chooseFile')}</span>
          </button>
          <span className={`inline-block py-2 px-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-100 shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.005]`}>
            {videoFile ? videoFile.name : t('noFileChosen')}
          </span>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
            ref={fileInputRef}
          />
        </div>
      </div>

      {videoFile && (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-xl shadow-lg overflow-hidden transition-all duration-400 ease-in-out hover:shadow-xl">
            <div data-vjs-player>
              <video ref={videoRef} className="video-js vjs-big-play-centered" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
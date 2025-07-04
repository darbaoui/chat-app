'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'

// SVG Icons as React Components
const MicIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

const PauseIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>
);

const StopIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

const PlayIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M8 5v14l11-7z"></path>
    </svg>
);

const PlaybackPauseIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
    </svg>
);

const TrashIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const SendIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

function AudioRecorder() {
    const [recordingState, setRecordingState] = useState('inactive');
    const [timer, setTimer] = useState('00:00');
    const [finalAudioBlob, setFinalAudioBlob] = useState(null);
    const [outputAudioURL, setOutputAudioURL] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveSurferLoaded, setWaveSurferLoaded] = useState(false);
    const [permissionError, setPermissionError] = useState('');

    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const recordPluginRef = useRef(null);
    const startTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);
    const pauseStartTimeRef = useRef(0);
    const timerIntervalRef = useRef(null);

    // Load WaveSurfer libraries

    // Initialize WaveSurfer when libraries are loaded
    useEffect(() => {
        if (!waveformRef.current) return;

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#60a5fa',
            progressColor: '#3b82f6',
            height: 100,
            barWidth: 3,
            barGap: 1,
            barRadius: 2,
            normalize: true,
            backend: 'WebAudio'
        });

        const recordPlugin = ws.registerPlugin(RecordPlugin.create({
            renderRecordedAudio: false,
            scrollingWaveform: true,
            timeslice: 1000
        }));

        wavesurferRef.current = ws;
        recordPluginRef.current = recordPlugin;

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));

        recordPlugin.on('record-start', () => {
            setRecordingState('recording');
            startTimeRef.current = Date.now();
            totalPausedTimeRef.current = 0;
            startTimer();
        });

        recordPlugin.on('record-pause', () => {
            setRecordingState('paused');
            pauseStartTimeRef.current = Date.now();
            stopTimer();
        });

        recordPlugin.on('record-resume', () => {
            setRecordingState('recording');
            totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
            startTimer();
        });

        recordPlugin.on('record-end', (blob) => {
            setRecordingState('stopped');
            setFinalAudioBlob(blob);
            stopTimer();

            const audioUrl = URL.createObjectURL(blob);
            ws.load(audioUrl);
        });

        recordPlugin.on('record-error', (error) => {
            console.error('Recording error:', error);
            setPermissionError('Recording failed. Please check microphone permissions.');
            resetRecorder();
        });

        return () => {
            if (ws) ws.destroy();
        };
    }, [waveSurferLoaded]);

    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        const updateTimer = () => {
            if (startTimeRef.current === 0) return;
            const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        updateTimer();
        timerIntervalRef.current = setInterval(updateTimer, 1000);
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    };

    const resetRecorder = useCallback(() => {
        // if (recordPluginRef.current) {
        //     recordPluginRef.current.stopRecording();
        // }

        // if (wavesurferRef.current) {
        //     wavesurferRef.current.empty();
        // }

        // stopTimer();
        // setRecordingState('inactive');
        // setFinalAudioBlob(null);
        // setOutputAudioURL('');
        // setTimer('00:00');
        // setIsPlaying(false);
        // setPermissionError('');

        // totalPausedTimeRef.current = 0;
        // startTimeRef.current = 0;
    }, []);

    const handleRecordClick = () => {
        if (!recordPluginRef.current) {
            setPermissionError('Audio recorder not ready');
            return;
        }

        try {
            setPermissionError('');

            if (recordingState === 'inactive' || recordingState === 'stopped') {
                // resetRecorder();
                recordPluginRef.current.startRecording();
            } else if (recordingState === 'recording') {
                recordPluginRef.current.pauseRecording();
            } else if (recordingState === 'paused') {
                recordPluginRef.current.resumeRecording();
            }
        } catch (error) {
            console.error('Recording action failed:', error);
            setPermissionError('Could not access microphone. Please grant permission and try again.');
            resetRecorder();
        }
    };

    const handleStopPlayClick = () => {
        if (recordingState === 'recording' || recordingState === 'paused') {
            if (recordPluginRef.current) {
                recordPluginRef.current.stopRecording();
            }
        } else if (recordingState === 'stopped' && wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const handleDeleteClick = () => {
        resetRecorder();
    };

    const handleSendClick = () => {
        if (finalAudioBlob) {
            console.log("Simulating send to backend. Blob:", finalAudioBlob);
            const url = URL.createObjectURL(finalAudioBlob);
            setOutputAudioURL(url);
        }
    };

    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isStopped = recordingState === 'stopped';
    const isInactive = recordingState === 'inactive';

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4">Voice Recorder</h1>

            {permissionError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                    {permissionError}
                </div>
            )}



            {outputAudioURL && (
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Final Audio</h2>
                    <audio src={outputAudioURL} controls className="w-full"></audio>
                </div>
            )}

            <div className="flex items-center justify-center h-24 w-full bg-gray-100 rounded-lg mb-6 overflow-hidden">
                <div ref={waveformRef} className="w-full h-full"></div>
            </div>

            <div className="text-center text-2xl font-mono text-gray-700 mb-6">{timer}</div>

            <div className="flex items-center justify-center space-x-4">
                <button
                    onClick={handleDeleteClick}
                    disabled={isInactive || !waveSurferLoaded}
                    className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                >
                    <TrashIcon />
                </button>

                <button
                    onClick={handleRecordClick}
                    className={`p-6 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording || isPaused ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'}`}
                >
                    {isRecording ? <PauseIcon /> : <MicIcon />}
                </button>

                <button
                    onClick={handleStopPlayClick}
                    disabled={isInactive || !waveSurferLoaded}
                    className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                >
                    {isStopped ? (isPlaying ? <PlaybackPauseIcon /> : <PlayIcon />) : <StopIcon />}
                </button>

                {isStopped && (
                    <button
                        onClick={handleSendClick}
                        disabled={!finalAudioBlob}
                        className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    >
                        <SendIcon />
                    </button>
                )}
            </div>
        </div>
    );
}

export default AudioRecorder
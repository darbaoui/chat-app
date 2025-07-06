'use client'

import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.js';

// Waveform styling options
const AUDIO_WAVEFORM_OPTIONS = {
    waveColor: '#0c4a6e',
    progressColor: '#88aec4',
    barWidth: 1,
    barRadius: 2,
    cursorWidth: 0,
    cursorColor: 'transparent',
    height: 21,
    barGap: 2,
    barHeight: 21,
    dragToSeek: true,
    fillParent: true,
    normalize: true,
    barMinHeight: 4,
};

export default function AudioRecorder() {
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const recordRef = useRef(null);
    const timerRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [status, setStatus] = useState('Ready to record');
    const [peaksData, setPeaksData] = useState(null);
    const [hasRecording, setHasRecording] = useState(false);

    // Main initialization effect
    useEffect(() => {
        // Initialize WaveSurfer
        wavesurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            ...AUDIO_WAVEFORM_OPTIONS,
            autoScroll: false, // Important for the WhatsApp-style scroll
        });

        // Initialize the Record plugin
        recordRef.current = wavesurferRef.current.registerPlugin(
            RecordPlugin.create({
                scrollingWaveform: true,
                renderRecordedAudio: false,
            })
        );

        // Event listeners for recording states
        recordRef.current.on('record-start', () => {
            startTimer();
            setStatus('Recording...');
        });

        recordRef.current.on('record-end', (blob) => {
            stopTimer();
            setTimeout(() => {
                wavesurferRef.current.loadBlob(blob);
                setStatus('Recording complete. Ready to send.');
                setHasRecording(true);
            }, 100);
        });

        recordRef.current.on('record-pause', () => {
            setStatus('Recording paused');
            stopTimer();
        });

        recordRef.current.on('record-resume', () => {
            setStatus('Recording resumed');
            startTimer();
        });

        // Cleanup on component unmount
        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
            }
        };
    }, []);

    // Effect to handle the smooth scrolling during recording
    useEffect(() => {
        if (!isRecording || !recordRef.current) return;

        const scrollWaveform = () => {
            if (waveformRef.current) {
                waveformRef.current.scrollLeft = waveformRef.current.scrollWidth;
            }
        };

        recordRef.current.on('record-progress', scrollWaveform);

        return () => {
            recordRef.current.un('record-progress', scrollWaveform);
        };
    }, [isRecording]);

    const startTimer = () => {
        const startTime = Date.now() - recordingTime * 1000;
        timerRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setRecordingTime(elapsed);
        }, 100);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRecord = async () => {
        if (isRecording) {
            recordRef.current.stopRecording();
            setIsRecording(false);
            setIsPaused(false);
        } else {
            handleReset();
            try {
                await recordRef.current.startRecording();
                setIsRecording(true);
                setHasRecording(false);
            } catch (error) {
                setStatus('Error: Could not access microphone. Please check permissions.');
                console.error('Recording error:', error);
            }
        }
    };

    const handlePause = () => {
        if (isPaused) {
            recordRef.current.resumeRecording();
            setIsPaused(false);
        } else {
            recordRef.current.pauseRecording();
            setIsPaused(true);
        }
    };

    const handleSend = () => {
        const peaks = wavesurferRef.current.getDecodedData();
        console.log('backend.getPeaks', wavesurferRef.current)
        if (peaks) {
            const channelData = peaks.getChannelData(0);
            const sampleRate = 100;
            const sampledPeaks = [];
            for (let i = 0; i < channelData.length; i += sampleRate) {
                sampledPeaks.push(channelData[i]);
            }

            const peaksDataForDB = {
                peaks: sampledPeaks,
                sampleRate: sampleRate,
                duration: wavesurferRef.current.getDuration(),
                numberOfChannels: peaks.numberOfChannels,
                originalLength: channelData.length,
                timestamp: new Date().toISOString()
            };

            setPeaksData(peaksDataForDB);
            setStatus('Peaks data generated! You can now store this in your database.');
            console.log('Peaks data for database:', peaksDataForDB);
        }
    };

    const handleReset = () => {
        if (isRecording) {
            recordRef.current.stopRecording();
        }
        wavesurferRef.current.empty();
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        setStatus('Ready to record');
        setPeaksData(null);
        setHasRecording(false);
        stopTimer();
    };

    // CSS styles are now embedded inside the component
    const styles = `
    .waveform-container {
      overflow-x: scroll;
      scroll-behavior: smooth;
      scrollbar-width: none; /* For Firefox */
      -ms-overflow-style: none;  /* For IE and Edge */
    }
    .waveform-container::-webkit-scrollbar {
      display: none; /* For Chrome, Safari, and Opera */
    }
  `;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Injecting styles directly into the component */}
            <style>{styles}</style>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Audio Recorder</h1>

                <div className="relative overflow-hidden rounded-lg bg-gray-50 p-4">
                    <div
                        ref={waveformRef}
                        className="waveform-container" // This class is targeted by the styles above
                        style={{ minHeight: '21px' }}
                    />

                    {isRecording && !isPaused && (
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-600 font-medium">REC</span>
                        </div>
                    )}
                </div>

                <div className="text-2xl font-bold text-sky-900 my-4">
                    {formatTime(recordingTime)}
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleRecord}
                        className={`px-6 py-3 rounded-md font-medium text-white flex items-center gap-2 transition-all
               ${isRecording
                                ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                                : 'bg-red-500 hover:bg-red-600'}`}
                    >
                        <span>🎤</span>
                        <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                    </button>

                    {isRecording && (
                        <button
                            onClick={handlePause}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-md font-medium text-white flex items-center gap-2 transition-all"
                        >
                            <span>{isPaused ? '▶️' : '⏸️'}</span>
                            <span>{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>
                    )}

                    <button
                        onClick={handleSend}
                        disabled={!hasRecording}
                        className={`px-6 py-3 rounded-md font-medium text-white flex items-center gap-2 transition-all
               ${hasRecording
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        <span>📤</span>
                        <span>Send & Get Peaks</span>
                    </button>

                    <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 rounded-md font-medium text-white flex items-center gap-2 transition-all"
                    >
                        <span>🗑️</span>
                        <span>Reset</span>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-gray-100 rounded-md text-sm text-gray-600">
                    {status}
                </div>

                {peaksData && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                        <h3 className="font-bold text-gray-700 mb-2">Peaks Data (for database storage):</h3>
                        <pre className="text-xs overflow-auto max-h-48 bg-white p-3 rounded border border-gray-200">
                            {JSON.stringify(peaksData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
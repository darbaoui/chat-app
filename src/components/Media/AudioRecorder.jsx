'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';

// SVG Icons as React Components for better reusability and clarity
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

// Style component to inject CSS into the document head
const Style = () => (
    <style>{`
        .waveform-container {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            height: 100px;
            width: 100%;
            background-color: #f3f4f6;
            border-radius: 0.5rem;
            overflow: hidden;
            cursor: pointer;
        }
        .controls button {
            transition: all 0.2s ease-in-out;
            position: relative;
        }
        .controls button:hover {
            transform: scale(1.05);
        }
    `}</style>
);


function AudioRecorder() {
    // State for managing recording status, audio data, and UI
    const [recordingState, setRecordingState] = useState('inactive'); // inactive, recording, paused, stopped
    const [timer, setTimer] = useState('00:00');
    const [finalAudioBlob, setFinalAudioBlob] = useState(null);
    const [outputAudioURL, setOutputAudioURL] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs for DOM elements and audio processing objects
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const waveformDataRef = useRef([]);
    const canvasRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const recordingAnimationIdRef = useRef(null);
    const playbackAnimationIdRef = useRef(null);

    // Refs for timer logic
    const startTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);
    const pauseStartTimeRef = useRef(0);
    const lastPushTimeRef = useRef(0);

    // --- Waveform Drawing Logic ---

    // Utility to draw a rounded rectangle, used for waveform bars
    const drawRoundedRect = useCallback((ctx, x, y, width, height, radius) => {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }, []);

    // Draws the waveform during live recording
    const drawLiveWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#60a5fa';

        const barWidth = 4;
        const gap = 2;
        const radius = barWidth / 2;
        const totalBarWidth = barWidth + gap;
        const maxBars = Math.floor(width / totalBarWidth);
        const visibleData = waveformDataRef.current.slice(-maxBars);

        visibleData.forEach((barHeight, i) => {
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;
            drawRoundedRect(context, x, y, barWidth, barHeight, radius);
        });
    }, [drawRoundedRect]);

    // Draws the static waveform for playback
    const drawPlaybackWaveform = useCallback((currentTime = 0) => {
        const canvas = canvasRef.current;
        const audioPlayer = audioPlayerRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const numBars = waveformDataRef.current.length;
        if (numBars === 0) {
            // Draw a flat line when there's no recording
            context.fillStyle = '#d1d5db';
            const y = height / 2;
            drawRoundedRect(context, 0, y - 1, width, 2, 1);
            return;
        }

        const audioDuration = audioPlayer?.duration || (numBars * 120 / 1000);
        const currentBarIndex = audioDuration > 0 ? Math.floor((currentTime / audioDuration) * numBars) : 0;

        const totalBarWidth = width / numBars;
        const barWidth = totalBarWidth * 0.7; // Make bars take up 70% of their space
        const radius = barWidth > 2 ? 2 : 0;

        waveformDataRef.current.forEach((barHeight, i) => {
            context.fillStyle = i < currentBarIndex ? '#60a5fa' : '#d1d5db';
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;
            drawRoundedRect(context, x, y, barWidth, barHeight, radius);
        });
    }, [drawRoundedRect]);

    // --- Core Recording and Playback Logic ---

    const updateTimer = useCallback(() => {
        if (startTimeRef.current === 0) return;
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, []);

    // Animation loop for live recording visualization
    const visualizeDuringRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state !== 'recording') {
            if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
            return;
        }

        recordingAnimationIdRef.current = requestAnimationFrame(visualizeDuringRecording);

        const now = Date.now();
        const PUSH_INTERVAL = 120;
        if (now - lastPushTimeRef.current < PUSH_INTERVAL) {
            return;
        }
        lastPushTimeRef.current = now;

        const MIN_BAR_HEIGHT = 4;
        const MAX_BAR_HEIGHT = 40;

        analyserRef.current.getFloatTimeDomainData(analyserRef.current.timeDomainDataArray);
        let sumOfSquares = 0;
        for (const amplitude of analyserRef.current.timeDomainDataArray) {
            sumOfSquares += amplitude * amplitude;
        }
        const rms = Math.sqrt(sumOfSquares / analyserRef.current.timeDomainDataArray.length);
        const normalized = rms * 5;
        const barHeight = MIN_BAR_HEIGHT + (normalized * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT));
        waveformDataRef.current.push(Math.min(barHeight, MAX_BAR_HEIGHT));

        drawLiveWaveform();
    }, [drawLiveWaveform]);

    // Generates a static waveform from the final audio blob
    const generateWaveformFromFile = useCallback(async (audioBlob) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const tempAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);

            const rawData = audioBuffer.getChannelData(0);
            const samples = 85;
            const newWaveformData = [];
            const blockSize = Math.floor(rawData.length / samples);
            const MIN_BAR_HEIGHT = 2;
            const MAX_BAR_HEIGHT = 60;

            for (let i = 0; i < samples; i++) {
                const blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(rawData[blockStart + j] || 0);
                }
                const average = sum / blockSize;
                const normalized = average * 300;
                const barHeight = MIN_BAR_HEIGHT + (normalized * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT));
                newWaveformData.push(Math.min(barHeight, MAX_BAR_HEIGHT));
            }

            waveformDataRef.current = newWaveformData;
            drawPlaybackWaveform(0);
            tempAudioContext.close();
        } catch (e) {
            console.error("Failed to generate waveform:", e);
            waveformDataRef.current = [];
            drawPlaybackWaveform(0);
        }
    }, [drawPlaybackWaveform]);

    // Resets the recorder to its initial state
    const resetRecorder = useCallback(() => {
        // UPDATED: If there's an active recorder, nullify its onstop handler
        // to prevent it from processing partial data after being stopped.
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null;
        }

        // Stop stream tracks, which also stops the recorder
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
        if (playbackAnimationIdRef.current) cancelAnimationFrame(playbackAnimationIdRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        setRecordingState('inactive');
        setFinalAudioBlob(null);
        setOutputAudioURL('');
        setTimer('00:00');
        setIsPlaying(false);

        audioChunksRef.current = [];
        waveformDataRef.current = [];
        totalPausedTimeRef.current = 0;
        startTimeRef.current = 0;

        if (audioPlayerRef.current) {
            audioPlayerRef.current.src = '';
            audioPlayerRef.current.currentTime = 0;
        }

        drawPlaybackWaveform(0);
    }, [drawPlaybackWaveform]);

    // --- Event Handlers ---

    const handleRecordClick = async () => {
        if (recordingState === 'inactive' || recordingState === 'stopped') {
            // Start Recording
            try {
                resetRecorder();
                const stream = await navigator.mediaDevices.getUserMedia(
                    {
                        audio: {
                            noiseSuppression: true,
                            echoCancellation: true,
                            autoGainControl: true, // Optional: automatically adjusts volume 
                            sampleRate: 44100, // Optional: sample rate 
                            sampleSize: 16 // Optional: bit depth 
                        },
                        video: false // or true if you need video}
                    });

                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 2048;
                analyserRef.current.timeDomainDataArray = new Float32Array(analyserRef.current.fftSize);
                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceRef.current.connect(analyserRef.current);

                const recorder = new MediaRecorder(stream);

                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = event => audioChunksRef.current.push(event.data);

                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    setFinalAudioBlob(audioBlob);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    if (audioPlayerRef.current) audioPlayerRef.current.src = audioUrl;
                    stream.getTracks().forEach(track => track.stop());
                    generateWaveformFromFile(audioBlob);
                };

                recorder.start();
                setRecordingState('recording');
                startTimeRef.current = Date.now();
                visualizeDuringRecording();

            } catch (error) {
                console.error('Error accessing microphone:', error);
                alert("Could not access the microphone. Please grant permission and try again.");
                resetRecorder();
            }
        } else if (recordingState === 'recording') {
            // Pause Recording
            mediaRecorderRef.current?.pause();
            setRecordingState('paused');
            pauseStartTimeRef.current = Date.now();
            if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
        } else if (recordingState === 'paused') {
            // Resume Recording
            mediaRecorderRef.current?.resume();
            setRecordingState('recording');
            totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
            visualizeDuringRecording();
        }
    };

    const handleStopPlayClick = () => {
        if (recordingState === 'recording' || recordingState === 'paused') {
            // Stop Recording
            mediaRecorderRef.current?.stop();
            setRecordingState('stopped');
            if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
        } else if (recordingState === 'stopped') {
            // Play/Pause Playback
            if (audioPlayerRef.current) {
                if (audioPlayerRef.current.paused) {
                    audioPlayerRef.current.play();
                } else {
                    audioPlayerRef.current.pause();
                }
            }
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

    const handleWaveformClick = (e) => {
        if (recordingState !== 'stopped' || !audioPlayerRef.current?.duration) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioPlayerRef.current.currentTime = audioPlayerRef.current.duration * percentage;
    };

    // --- useEffect Hooks for setup and event listeners ---

    // Initial canvas setup and resize listener
    useEffect(() => {
        const setupCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            console.log('rect --->', rect)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const context = canvas.getContext('2d');
            context.scale(dpr, dpr);
            drawPlaybackWaveform(0);
        };

        setupCanvas();
        window.addEventListener('resize', setupCanvas);

        return () => window.removeEventListener('resize', setupCanvas);
    }, [drawPlaybackWaveform]);




    // Timer update effect
    useEffect(() => {
        let timerInterval;
        if (recordingState === 'recording') {
            updateTimer(); // Update immediately on start/resume
            timerInterval = setInterval(updateTimer, 1000);
        }
        return () => {
            clearInterval(timerInterval);
        };
    }, [recordingState, updateTimer]);

    // Audio player event listeners
    useEffect(() => {
        const player = audioPlayerRef.current;
        if (!player) return;

        const handlePlay = () => {
            setIsPlaying(true);
            const visualize = () => {
                if (player.paused) return;
                drawPlaybackWaveform(player.currentTime);
                playbackAnimationIdRef.current = requestAnimationFrame(visualize);
            };
            visualize();
        };
        const handlePause = () => {
            setIsPlaying(false);
            if (playbackAnimationIdRef.current) cancelAnimationFrame(playbackAnimationIdRef.current);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            drawPlaybackWaveform(0);
        };
        const handleTimeUpdate = () => {
            if (player.paused) {
                drawPlaybackWaveform(player.currentTime);
            }
        };

        player.addEventListener('play', handlePlay);
        player.addEventListener('pause', handlePause);
        player.addEventListener('ended', handleEnded);
        player.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            player.removeEventListener('play', handlePlay);
            player.removeEventListener('pause', handlePause);
            player.removeEventListener('ended', handleEnded);
            player.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [drawPlaybackWaveform]);

    // --- Render Logic ---

    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isStopped = recordingState === 'stopped';
    const isInactive = recordingState === 'inactive';

    return (
        <>
            <Style />
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4">Voice Recorder</h1>

                {outputAudioURL && (
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2 text-center">Final Audio</h2>
                        <audio src={outputAudioURL} controls className="w-full"></audio>
                    </div>
                )}

                <div className="waveform-container mb-6" onClick={handleWaveformClick}>
                    <canvas ref={canvasRef} id="waveform" className="w-full h-full"></canvas>
                </div>

                <div className="text-center text-2xl font-mono text-gray-700 mb-6">{timer}</div>

                <div className="controls flex items-center justify-center space-x-4">
                    <button
                        onClick={handleDeleteClick}
                        disabled={isInactive}
                        className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashIcon />
                    </button>

                    <button
                        onClick={handleRecordClick}
                        className={`p-6 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg ${isRecording || isPaused ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'}`}
                    >
                        {isRecording ? <PauseIcon /> : <MicIcon />}
                    </button>

                    <button
                        onClick={handleStopPlayClick}
                        disabled={isInactive}
                        className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isStopped ? (isPlaying ? <PlaybackPauseIcon /> : <PlayIcon />) : <StopIcon />}
                    </button>

                    {isStopped && (
                        <button
                            onClick={handleSendClick}
                            disabled={!finalAudioBlob}
                            className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SendIcon />
                        </button>
                    )}
                </div>

                <audio ref={audioPlayerRef} className="hidden"></audio>
            </div>
        </>
    );
}


export default AudioRecorder
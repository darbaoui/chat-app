// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import PlayRecordAudio from "./PlayRecordAudio";
const PUSH_INTERVAL = 50;

const RecordAudio = forwardRef(({ updateRecordingState }, ref) => {
    // State for managing recording status, audio data, and UI
    const [recordingState, setRecordingState] = useState('inactive');
    const [timer, setTimer] = useState('00:00');
    const [finalAudioBlob, setFinalAudioBlob] = useState(null);
    const [outputAudioURL, setOutputAudioURL] = useState('');

    // Refs for DOM elements and audio processing objects
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const waveformDataRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const recordingAnimationIdRef = useRef(null);
    const waveformContainer = useRef(null);
    const canvasRef = useRef(null);
    const playbackAnimationIdRef = useRef(null);

    // Refs for timer logic
    const startTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);
    const pauseStartTimeRef = useRef(0);
    const lastPushTimeRef = useRef(0);



    // Fixed drawRoundedRect function
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

    // Fixed live waveform drawing
    const drawLiveWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Clear canvas
        context.clearRect(0, 0, width, height);
        context.fillStyle = AUDIO_WAVEFORM_OPRIONS.waveColor;

        const { barWidth, barGap } = AUDIO_WAVEFORM_OPRIONS;
        const totalBarWidth = barWidth + barGap;
        const maxBars = Math.floor(width / totalBarWidth);
        const visibleData = waveformDataRef.current.slice(-maxBars);

        visibleData.forEach((barHeight, i) => {
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;

            // For 1px width bars, use fillRect for better visibility
            if (barWidth === 1) {
                context.fillRect(x, y, barWidth, barHeight);
            } else {
                const radius = Math.min(barWidth / 2, barHeight / 2);
                drawRoundedRect(context, x, y, barWidth, barHeight, radius);
            }
        });
    }, [drawRoundedRect]);


    // Fixed canvas setup with proper DPR handling
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = waveformContainer.current;
        if (!canvas || !container) return;

        // Use ResizeObserver to get the most accurate dimensions
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;

                console.log('ResizeObserver dimensions:', { width, height });

                if (width <= 0 || height <= 0) return;

                const dpr = window.devicePixelRatio || 1;

                // Check if canvas already has the correct dimensions
                if (canvas.width === width * dpr && canvas.height === height * dpr) {
                    return;
                }

                // Set canvas size accounting for device pixel ratio
                canvas.width = width * dpr;
                canvas.height = height * dpr;

                // Scale canvas back down using CSS
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                // Scale the context to match device pixel ratio
                const context = canvas.getContext('2d');
                context.scale(dpr, dpr);

                // Redraw the waveform after canvas resize
                drawLiveWaveform();
            }
        });

        resizeObserver.observe(container);

        // Store the observer for cleanup
        container._resizeObserver = resizeObserver;

        // Fallback: try to set up immediately with current dimensions
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        if (width > 0 && height > 0) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const context = canvas.getContext('2d');
            context.scale(dpr, dpr);
            drawLiveWaveform();
        }
    }, [drawLiveWaveform]);


    // Animation loop for live recording visualization
    const visualizeDuringRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state !== 'recording') {
            if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
            return;
        }

        recordingAnimationIdRef.current = requestAnimationFrame(visualizeDuringRecording);

        const now = Date.now();
        if (now - lastPushTimeRef.current < PUSH_INTERVAL) {
            return;
        }
        lastPushTimeRef.current = now;

        const MIN_BAR_HEIGHT = AUDIO_WAVEFORM_OPRIONS.barMinHeight;
        const MAX_BAR_HEIGHT = AUDIO_WAVEFORM_OPRIONS.barHeight;

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

    // Resets the recorder to its initial state
    const resetRecorder = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null;
        }

        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }

        if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
        if (playbackAnimationIdRef.current) cancelAnimationFrame(playbackAnimationIdRef.current);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        // Clean up ResizeObserver
        if (waveformContainer.current?._resizeObserver) {
            waveformContainer.current._resizeObserver.disconnect();
            delete waveformContainer.current._resizeObserver;
        }

        setRecordingState('inactive');
        setFinalAudioBlob(null);
        setOutputAudioURL('');
        setTimer('00:00');

        audioChunksRef.current = [];
        waveformDataRef.current = [];
        totalPausedTimeRef.current = 0;
        startTimeRef.current = 0;
    }, []);

    const startRecording = useCallback(async () => {
        try {
            resetRecorder();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
                const type = audioChunksRef.current[0]?.type || 'audio/wav'
                const audioBlob = new Blob(audioChunksRef.current, { type });
                setFinalAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start(100);
            setRecordingState('recording');
            startTimeRef.current = Date.now();
            visualizeDuringRecording();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert("Could not access the microphone. Please grant permission and try again.");
            resetRecorder();
        }
    }, [resetRecorder, visualizeDuringRecording]);

    const pauseRecording = useCallback(() => {
        mediaRecorderRef.current?.pause();
        setRecordingState('paused');
        pauseStartTimeRef.current = Date.now();
        if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setFinalAudioBlob(audioBlob);
    }, []);

    const resumeRecording = useCallback(() => {
        mediaRecorderRef.current?.resume();
        setRecordingState('recording');
        totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
        visualizeDuringRecording();
    }, [visualizeDuringRecording]);

    const updateTimer = useCallback(() => {
        if (startTimeRef.current === 0) return;
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, []);

    // Setup canvas on mount - use useLayoutEffect for synchronous DOM updates
    useLayoutEffect(() => {
        setupCanvas();

        // Cleanup function
        return () => {
            if (waveformContainer.current?._resizeObserver) {
                waveformContainer.current._resizeObserver.disconnect();
                delete waveformContainer.current._resizeObserver;
            }
        };
    }, [setupCanvas]);

    // Timer update effect
    useEffect(() => {
        let timerInterval;
        if (recordingState === 'recording') {
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
        }
        return () => {
            clearInterval(timerInterval);
        };
    }, [recordingState, updateTimer]);

    useEffect(() => {
        updateRecordingState?.(recordingState);
    }, [recordingState, updateRecordingState]);

    // This hook tells the parent component what the ref should contain
    useImperativeHandle(ref, () => ({
        startRecord() {
            startRecording();
        },
        removeRecord() {
            resetRecorder();
        },
        pauseRecord() {
            pauseRecording();
        },
        resumeRecord() {
            resumeRecording();
        }
    }), [startRecording, resetRecorder, pauseRecording, resumeRecording]);

    const isAudioPaused = recordingState === 'paused';

    return (
        <div
            className={cn('flex items-center justify-start h-auto gap-2.5 w-full px-1 relative')}
        >
            {isAudioPaused && <div className="absolute inset-0 z-10 bg-chat rounded-3xl">
                <PlayRecordAudio audioBlob={finalAudioBlob} waveformData={waveformDataRef.current} />
            </div>
            }
            <div ref={waveformContainer} className="flex items-center justify-start h-6 cursor-pointer relative flex-1">
                <canvas ref={canvasRef} id="waveform" className="w-full h-full"></canvas>
            </div>
            <span
                key="duration"
                className="relative w-10 text-center text-chatBoxMe-foreground"
            >
                {timer}
            </span>
        </div>
    );
});

RecordAudio.displayName = 'RecordAudio';

export default RecordAudio;
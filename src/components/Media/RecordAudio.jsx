// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import PlayRecordAudio from "./PlayRecordAudio";
import useWaveformCanvas from "@/hooks/useWaveformCanvas";
const PUSH_INTERVAL = 50;

const RecordAudio = forwardRef(({ updateRecordingState, autoStart, sendFinalAudioBlob }, ref) => {




    // State for managing recording status, audio data, and UI
    const [recordingState, setRecordingState] = useState('inactive');
    const [timer, setTimer] = useState('00:00');
    const [finalAudioBlob, setFinalAudioBlob] = useState(null);

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

    const isPausingRef = useRef(false);

    // Refs for timer logic
    const startTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);
    const pauseStartTimeRef = useRef(0);
    const lastPushTimeRef = useRef(0);

    const { setupCanvas, drawRoundedRect } = useWaveformCanvas(canvasRef, waveformContainer)


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


    useEffect(() => {
        const container = waveformContainer.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            setupCanvas();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [setupCanvas])

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

        // This multiplier is used to scale the RMS value of the audio signal.
        // The RMS value is typically a small float between 0 and 1, and this factor
        // amplifies it to create a more visually dynamic and responsive bar height.
        // The value was likely determined through experimentation to achieve the desired visual effect.
        const RMS_AMPLITUDE_SCALAR = 5;

        analyserRef.current.getFloatTimeDomainData(analyserRef.current.timeDomainDataArray);
        let sumOfSquares = 0;
        for (const amplitude of analyserRef.current.timeDomainDataArray) {
            sumOfSquares += amplitude * amplitude;
        }
        const rms = Math.sqrt(sumOfSquares / analyserRef.current.timeDomainDataArray.length);
        const normalized = rms * RMS_AMPLITUDE_SCALAR;
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
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }

        setRecordingState('inactive');
        setFinalAudioBlob(null);
        setTimer('00:00');
        isPausingRef.current = false

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
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);



            analyserRef.current.timeDomainDataArray = dataArray;
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const recorder = new MediaRecorder(stream, {
                noiseSuppression: true,
                echoCancellation: true,
            });

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    // If paused, create interim blob
                    if (isPausingRef.current) {
                        const type = event.data.type || 'audio/webm';
                        const audioBlob = new Blob(audioChunksRef.current, { type });
                        setFinalAudioBlob(audioBlob);
                        isPausingRef.current = false
                    }
                }
            };

            recorder.onstop = async () => {
                if (audioChunksRef.current.length === 0) {
                    console.warn("Recording stopped with no data.");
                    return;
                }
                const elapsedMilliseconds = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
                const durationInSeconds = elapsedMilliseconds / 1000;
                const type = audioChunksRef.current[0].type || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type });
                setFinalAudioBlob(audioBlob);
                await sendFinalAudioBlob({
                    audioBlob,
                    duration: durationInSeconds,
                    waveData: waveformDataRef.current
                });

                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setRecordingState('recording');
            startTimeRef.current = Date.now();
            visualizeDuringRecording();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            resetRecorder();
        }
    }, [resetRecorder, visualizeDuringRecording]);

    const pauseRecording = useCallback(() => {
        isPausingRef.current = true;
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current?.pause();
        setRecordingState('paused');
        pauseStartTimeRef.current = Date.now();
        if (recordingAnimationIdRef.current) cancelAnimationFrame(recordingAnimationIdRef.current);
    }, []);

    const resumeRecording = useCallback(() => {
        mediaRecorderRef.current?.resume();
        setRecordingState('recording');
        totalPausedTimeRef.current += Date.now() - pauseStartTimeRef.current;
        visualizeDuringRecording();
    }, [visualizeDuringRecording]);


    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
        setRecordingState('stopped');
    }, [])



    useEffect(() => {
        if (autoStart) {
            startRecording();
        }
    }, [autoStart, startRecording]);

    const updateTimer = useCallback(() => {
        if (startTimeRef.current === 0) return;
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, []);

    // Setup canvas on mount and resize - use useLayoutEffect for synchronous DOM updates
    useLayoutEffect(() => {
        if (!waveformContainer?.current) return
        setupCanvas();
    }, [setupCanvas, waveformContainer]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Use a small delay to ensure layout has settled
            setTimeout(() => {
                setupCanvas();
            }, 0);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
        },
        stopRecord() {
            stopRecording();
        }
    }), [startRecording, resetRecorder, pauseRecording, resumeRecording, stopRecording]);

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
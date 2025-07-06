// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
const PUSH_INTERVAL = 50;

const PlayRecordAudio = forwardRef(({ isRecording }, ref) => {

    // State for managing recording status, audio data, and UI
    const [recordingState, setRecordingState] = useState('inactive');
    const [timer, setTimer] = useState('00:00');
    const [finalAudioBlob, setFinalAudioBlob] = useState(null);
    const [outputAudioURL, setOutputAudioURL] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs for DOM elements and audio processing objects
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const waveformDataRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const recordingAnimationIdRef = useRef(null);
    const canvasRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const playbackAnimationIdRef = useRef(null);

    // Refs for timer logic
    const startTimeRef = useRef(0);
    const totalPausedTimeRef = useRef(0);
    const lastPushTimeRef = useRef(0);

    const handleRecordClick = async () => {
        if (recordingState === 'inactive' || recordingState === 'stopped') {
            // Start Recording
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

        console.log('height ---->', height)
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = AUDIO_WAVEFORM_OPRIONS.waveColor // '#60a5fa';

        const barWidth = 1;
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
            context.fillStyle = 'transparent';
            const y = height / 2;
            drawRoundedRect(context, 0, y - 1, width, 2, 1);
            return;
        }

        const audioDuration = audioPlayer?.duration || (numBars * 120 / 1000);
        const currentBarIndex = audioDuration > 0 ? Math.floor((currentTime / audioDuration) * numBars) : 0;

        const totalBarWidth = width / numBars;
        const barWidth = totalBarWidth * 0.7; // Make bars take up 70% of their space
        const radius = barWidth > 2 ? 2 : 0;

        const { waveColor, progressColor } = AUDIO_WAVEFORM_OPRIONS
        waveformDataRef.current.forEach((barHeight, i) => {
            context.fillStyle = i < currentBarIndex ? waveColor : progressColor;
            const x = i * totalBarWidth;
            const y = (height - barHeight) / 2;


            drawRoundedRect(context, x, y, barWidth, barHeight, radius);
        });
    }, [drawRoundedRect]);

    const updateTimer = useCallback(() => {
        if (startTimeRef.current === 0) return;
        const elapsed = Date.now() - startTimeRef.current - totalPausedTimeRef.current;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, []);

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


    // This hook tells the parent component (MessageInput) what the ref should contain.
    useImperativeHandle(ref, () => ({
        startRecord() {
            handleRecordClick();
        },
        removeRecord() {
            console.log('remove Record');
        },
        pauseRecord() {
            console.log('pause Record');
        },
        resumeRecord() {
            console.log('resume Record');
        }
    }),
        [] // Dependencies for when to re-create the handle. Empty is fine here.
    );


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
            const MIN_BAR_HEIGHT = AUDIO_WAVEFORM_OPRIONS.barMinHeight;
            const MAX_BAR_HEIGHT = AUDIO_WAVEFORM_OPRIONS.barHeight;

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


    const handleWaveformClick = (e) => {
        if (recordingState !== 'stopped' || !audioPlayerRef.current?.duration) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioPlayerRef.current.currentTime = audioPlayerRef.current.duration * percentage;
    };


    // Initial canvas setup and resize listener
    const setupCanvas = () => {
        console.log('setupCanvas')
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = 240; //parent is 300 and timer=40px and padding is 10px (300-40-10 = 250) but width 240 works perfectly
        canvas.width = width * dpr;
        // console.log('width --->', rect)
        canvas.height = rect.height * dpr;
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
        drawPlaybackWaveform(0);
    };
    useEffect(() => {

        setupCanvas();
        window.addEventListener('resize', setupCanvas);

        return () => window.removeEventListener('resize', setupCanvas);
    }, [drawPlaybackWaveform]);

    return (
        <div
            className={cn('flex items-center justify-start h-auto gap-2.5 w-full px-1')}
        >
            {/* <Button
                className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
            >
                <Play className="w-[14px]" size={14} />
            </Button> */}

            <div className="flex items-center justify-start h-6 cursor-pointer rounded-lg relative w-[250px] border border-red-500" onClick={handleWaveformClick}>
                <canvas ref={canvasRef} id="waveform" className="w-full h-full"></canvas>
            </div>
            <span
                key="duration"
                className="relative w-10 text-center text-chatBoxMe-foreground"
            >
                {timer}
            </span>


            <audio ref={audioPlayerRef} className="hidden"></audio>
        </div>
    );
});

PlayRecordAudio.displayName = 'PlayRecordAudio';

export default PlayRecordAudio;
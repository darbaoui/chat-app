// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import { set } from "date-fns";
const PUSH_INTERVAL = 50;

const PlayRecordAudio = ({ audioBlob, waveformData }) => {


    const canvasRef = useRef(null);
    const waveformContainer = useRef(null);
    const audioPlayerRef = useRef(null);
    const [scaledData, setScaledData] = useState([]);
    const playbackAnimationIdRef = useRef(null);
    const [timer, setTimer] = useState('00:00');
    const [recordingState, setRecordingState] = useState('pause');
    const [isPlaying, setIsPlaying] = useState(false);

    // New cursor state
    const [isDragging, setIsDragging] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);


    // Helper function to get position from mouse event
    const getPositionFromEvent = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        return Math.max(0, Math.min(1, clickX / rect.width));
    };

    // Enhanced handleWaveformClick with cursor support
    const handleWaveformClick = (e) => {
        if (!audioPlayerRef.current?.duration) return;

        const percentage = getPositionFromEvent(e);
        const newTime = audioPlayerRef.current.duration * percentage;

        // Update audio position
        audioPlayerRef.current.currentTime = newTime;

        // Update cursor position
        setCursorPosition(percentage);

        // Update waveform visual
        drawStaticBars(scaledData, percentage);
    };


    // Mouse down handler - start dragging
    const handleMouseDown = (e) => {
        if (!audioPlayerRef.current?.duration) return;

        setIsDragging(true);

        // Pause audio while dragging
        const wasPlaying = !audioPlayerRef.current.paused;
        if (wasPlaying) {
            audioPlayerRef.current.pause();
        }

        // Handle initial position
        handleWaveformClick(e);

        // Store if audio was playing before drag
        e.currentTarget.dataset.wasPlaying = wasPlaying;
    };


    // Mouse move handler - update cursor while dragging
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !audioPlayerRef.current?.duration) return;

        const percentage = getPositionFromEvent(e);
        const newTime = audioPlayerRef.current.duration * percentage;

        // Update audio position
        audioPlayerRef.current.currentTime = newTime;

        // Update cursor position
        setCursorPosition(percentage);

        // Update waveform visual
        drawStaticBars(scaledData, percentage);
    }, [isDragging, scaledData]);

    // Mouse up handler - end dragging
    const handleMouseUp = useCallback((e) => {
        if (!isDragging) return;

        setIsDragging(false);

        // Resume playing if it was playing before drag
        const wasPlaying = e.currentTarget?.dataset?.wasPlaying === 'true';
        if (wasPlaying && audioPlayerRef.current) {
            audioPlayerRef.current.play();
        }
    }, [isDragging]);

    // Add global mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const playPauseAudio = () => {
        if (audioPlayerRef.current) {
            if (audioPlayerRef.current.paused) {
                setRecordingState('play');
                audioPlayerRef.current.play();
            } else {
                setRecordingState('pause');
                audioPlayerRef.current.pause();
            }
        }
    };

    // Fixed canvas setup
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = waveformContainer.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        // Use actual container dimensions
        const width = rect.width;
        const height = rect.height;

        // Set canvas size accounting for device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Scale canvas back down using CSS
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Scale the context to match device pixel ratio
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
    }, []);



    useEffect(() => {
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioPlayerRef.current) audioPlayerRef.current.src = audioUrl;

        return () => {
            URL.revokeObjectURL(audioUrl);
        };
    }, [audioBlob]);

    // Fixed bar count calculation
    const getBarCount = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;

        const { barWidth, barGap } = AUDIO_WAVEFORM_OPRIONS;
        const availableWidth = canvas.clientWidth; // Use clientWidth for actual display width
        return Math.floor(availableWidth / (barWidth + barGap));
    }, []);

    // Fixed drawRoundedRect function
    const drawRoundedRect = useCallback((ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }, []);

    // Fixed data scaling
    const scaleDataToFit = useCallback((data, count) => {
        if (!data || data.length === 0) return [];
        if (data.length <= count) return [...data];

        const scaled = [];
        const scale = data.length / count;

        for (let i = 0; i < count; i++) {
            const startIndex = Math.floor(i * scale);
            const endIndex = Math.floor((i + 1) * scale);
            const chunk = data.slice(startIndex, endIndex);
            scaled.push(chunk.length ? Math.max(...chunk) : 0);
        }

        return scaled;
    }, []);


    const drawCursor = useCallback((context, cursorX, canvasHeight) => {

        const { height: cursorHeight, waveColor: cursorColor } = AUDIO_WAVEFORM_OPRIONS;
        const cursorY = (canvasHeight - cursorHeight) / 2;
        context.fillStyle = cursorColor;
        const cursorWidth = 2;
        const cursorRadius = 1;

        // Ensure cursor is within canvas bounds
        const adjustedCursorX = Math.max(cursorWidth / 2, Math.min(cursorX, context.canvas.clientWidth - cursorWidth / 2));

        // Draw rounded rectangle cursor
        context.beginPath();
        context.moveTo(adjustedCursorX - cursorWidth / 2 + cursorRadius, cursorY);
        context.arcTo(adjustedCursorX + cursorWidth / 2, cursorY, adjustedCursorX + cursorWidth / 2, cursorY + cursorHeight, cursorRadius);
        context.arcTo(adjustedCursorX + cursorWidth / 2, cursorY + cursorHeight, adjustedCursorX - cursorWidth / 2, cursorY + cursorHeight, cursorRadius);
        context.arcTo(adjustedCursorX - cursorWidth / 2, cursorY + cursorHeight, adjustedCursorX - cursorWidth / 2, cursorY, cursorRadius);
        context.arcTo(adjustedCursorX - cursorWidth / 2, cursorY, adjustedCursorX + cursorWidth / 2, cursorY, cursorRadius);
        context.closePath();
        context.fill();


    }, []);


    // Fixed drawStaticBars function
    const drawStaticBars = useCallback((data, progress = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        // Clear canvas
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        if (!data || data.length === 0) return;

        const progressIndex = Math.floor(data.length * progress);

        const { barWidth, barGap, progressColor, waveColor } = AUDIO_WAVEFORM_OPRIONS;
        const BAR_TOTAL_WIDTH = barWidth + barGap;

        // Find max value for normalization
        const maxValue = Math.max(...data);
        if (maxValue === 0) return;

        data.forEach((value, i) => {
            const x = i * BAR_TOTAL_WIDTH;

            // Normalize the bar height to canvas height
            const normalizedHeight = (value / maxValue) * canvasHeight * 0.85; // 85% of canvas height
            const barHeight = Math.max(1, normalizedHeight); // Minimum height of 1px

            // Center the bar vertically
            const y = (canvasHeight - barHeight) / 2;

            // Set color based on progress
            context.fillStyle = i < progressIndex ? progressColor : waveColor;

            // For 1px width bars, use simple rectangle for better visibility
            if (barWidth === 1) {
                context.fillRect(x, y, barWidth, barHeight);
            } else {
                // Use rounded rectangle for wider bars
                const radius = Math.min(AUDIO_WAVEFORM_OPRIONS.barRadius, barWidth / 2, barHeight / 2);
                drawRoundedRect(context, x, y, barWidth, barHeight, radius);
            }
        });


        const waveWidth = data.length * BAR_TOTAL_WIDTH
        // Draw cursor line
        const cursorX = progress * waveWidth;
        drawCursor(context, cursorX, canvasHeight);
    }, [drawRoundedRect, drawCursor]);

    // Fixed drawFinalWaveform function
    const drawFinalWaveform = useCallback((progress = 0) => {
        if (!waveformData || waveformData.length === 0) return;

        const barCount = getBarCount();

        if (barCount === 0) return;

        const scaledData = scaleDataToFit(waveformData, barCount);

        setScaledData(scaledData);

        drawStaticBars(scaledData, progress);

    }, [waveformData, getBarCount, scaleDataToFit, drawStaticBars]);

    // Setup canvas on mount and resize
    useEffect(() => {
        setupCanvas();
        const handleResize = () => {
            setupCanvas();
            // Redraw waveform after resize
            setTimeout(() => drawFinalWaveform(cursorPosition), 100);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvas, drawFinalWaveform]);

    // Draw waveform when data changes
    useEffect(() => {
        if (waveformData && waveformData.length > 0) {
            // Small delay to ensure canvas is properly set up
            setTimeout(() => drawFinalWaveform(), 50);
        }
    }, [waveformData, drawFinalWaveform]);




    // Audio player event listeners
    useEffect(() => {
        const player = audioPlayerRef.current;
        if (!player) return;

        const handlePlay = () => {
            setIsPlaying(true);
            const visualize = () => {
                if (player.paused) return;
                const progress = player.currentTime / player.duration;
                setCursorPosition(progress);
                drawStaticBars(scaledData, progress);
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
            setCursorPosition(0);
            drawStaticBars(scaledData, 0);
        };
        const handleTimeUpdate = () => {
            if (player.paused) {
                const progress = player.currentTime / player.duration;
                setCursorPosition(progress);
                drawStaticBars(scaledData, progress);
            } else {
                const elapsed = player.currentTime; // This is already in seconds
                const minutes = Math.floor(elapsed / 60); // Divide by 60, not 60000
                const seconds = Math.floor(elapsed % 60); // Modulo 60, not % 60000 / 1000
                setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
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
    }, [drawStaticBars, scaledData]);

    return (
        <div className="flex items-center justify-start h-auto gap-2.5 w-full">
            {isPlaying ? (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none flex items-center justify-center"
                    onClick={playPauseAudio}
                >
                    <Pause className="w-[14px]" size={14} />
                </Button>
            ) : (

                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none flex items-center justify-center"
                    onClick={playPauseAudio}
                >
                    <Play className="w-[14px]" size={14} />
                </Button>
            )
            }

            <div
                ref={waveformContainer}
                className="flex items-center justify-start h-6 cursor-pointer relative flex-1"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
            >
                <canvas
                    ref={canvasRef}
                    id="waveform"
                    className="w-full h-full"
                    style={{
                        imageRendering: 'pixelated',
                        imageRendering: '-moz-crisp-edges',
                        imageRendering: 'crisp-edges'
                    }}
                />
            </div>

            <span className="relative w-10 text-center text-chatBoxMe-foreground">
                {timer}
            </span>

            <audio ref={audioPlayerRef} className="hidden" />
        </div>
    );
};

PlayRecordAudio.displayName = 'PlayRecordAudio';

export default PlayRecordAudio;
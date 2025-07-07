// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
const PUSH_INTERVAL = 50;

const PlayRecordAudio = ({ audioBlob, waveformData }) => {


    const canvasRef = useRef(null);
    const waveformContainer = useRef(null);
    const audioPlayerRef = useRef(null);
    const [timer, setTimer] = useState('00:00');
    const [recordingState, setRecordingState] = useState('pause');

    const handleWaveformClick = (e) => {
        if (recordingState !== 'pause' || !audioPlayerRef.current?.duration) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioPlayerRef.current.currentTime = audioPlayerRef.current.duration * percentage;
    };

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

    // Fixed drawStaticBars function
    const drawStaticBars = useCallback((data, color, progress = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        // Clear canvas
        context.clearRect(0, 0, canvasWidth, canvasHeight);

        if (!data || data.length === 0) return;

        const progressIndex = Math.floor(data.length * progress);
        const { barWidth, barGap, progressColor } = AUDIO_WAVEFORM_OPRIONS;
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
            context.fillStyle = i < progressIndex ? progressColor : color;

            // For 1px width bars, use simple rectangle for better visibility
            if (barWidth === 1) {
                context.fillRect(x, y, barWidth, barHeight);
            } else {
                // Use rounded rectangle for wider bars
                const radius = Math.min(AUDIO_WAVEFORM_OPRIONS.barRadius, barWidth / 2, barHeight / 2);
                drawRoundedRect(context, x, y, barWidth, barHeight, radius);
            }
        });
    }, [drawRoundedRect]);

    // Fixed drawFinalWaveform function
    const drawFinalWaveform = useCallback((progress = 0) => {
        if (!waveformData || waveformData.length === 0) return;

        const { waveColor } = AUDIO_WAVEFORM_OPRIONS;
        const barCount = getBarCount();

        if (barCount === 0) return;

        const scaledData = scaleDataToFit(waveformData, barCount);
        drawStaticBars(scaledData, waveColor, progress);
    }, [waveformData, getBarCount, scaleDataToFit, drawStaticBars]);

    // Setup canvas on mount and resize
    useEffect(() => {
        setupCanvas();
        const handleResize = () => {
            setupCanvas();
            // Redraw waveform after resize
            setTimeout(() => drawFinalWaveform(), 100);
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

    return (
        <div className="flex items-center justify-start h-auto gap-2.5 w-full px-1">
            {recordingState === 'play' && (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-blue-600 border-none flex items-center justify-center"
                    onClick={playPauseAudio}
                >
                    <Pause className="w-[14px]" size={14} />
                </Button>
            )}

            {recordingState === 'pause' && (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-blue-600 border-none flex items-center justify-center"
                    onClick={playPauseAudio}
                >
                    <Play className="w-[14px]" size={14} />
                </Button>
            )}

            <div
                ref={waveformContainer}
                className="flex items-center justify-start h-6 cursor-pointer rounded-lg relative w-[224px] border border-gray-300 bg-white"
                onClick={handleWaveformClick}
            >
                <canvas
                    ref={canvasRef}
                    id="waveform"
                    className="w-full h-full rounded-lg"
                    style={{
                        imageRendering: 'pixelated',
                        imageRendering: '-moz-crisp-edges',
                        imageRendering: 'crisp-edges'
                    }}
                />
            </div>

            <span className="relative w-10 text-center text-gray-700">
                {timer}
            </span>

            <audio ref={audioPlayerRef} className="hidden" />
        </div>
    );
};

PlayRecordAudio.displayName = 'PlayRecordAudio';

export default PlayRecordAudio;
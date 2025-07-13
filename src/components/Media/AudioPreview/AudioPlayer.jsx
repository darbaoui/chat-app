'use client'

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AUDIO_WAVEFORM_OPRIONS } from '@/constants';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AudioPlayer = ({
    audioUrl,// required
    audioDuration,// required
    waveformData, // required
    className,
}) => {
    const canvasRef = useRef(null)
    const audioPlayerRef = useRef(null);
    const playbackAnimationIdRef = useRef(null);
    const wasPlayingBeforeDragRef = useRef(false);

    const [showRemaining, setShowRemaining] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1); // 1->1.2->1.5->2
    const [timer, setTimer] = useState('00:00');
    const [recordingState, setRecordingState] = useState('pause');

    // New cursor state
    const [isDragging, setIsDragging] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };


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

        // const barCount = getBarCount();
        const barCount = waveformData.length;

        console.log('----barCount----', barCount)

        if (barCount === 0) return;

        // const scaledData = scaleDataToFit(waveformData, barCount);
        // const scaledData = waveformData;

        // setScaledData(scaledData);

        drawStaticBars(waveformData, progress);

    }, [waveformData, scaleDataToFit, drawStaticBars]);




    useEffect(() => {
        if (!audioUrl) return;

        if (audioPlayerRef.current) audioPlayerRef.current.src = audioUrl;

    }, [audioUrl]);

    // Fixed canvas setup
    const setupCanvas = useCallback(() => {
        const { barWidth, barGap, height } = AUDIO_WAVEFORM_OPRIONS;
        const canvas = canvasRef.current;
        const width = waveformData.length * (barWidth + barGap) > 113 ? 113 : waveformData.length * (barWidth + barGap)
        if (!canvas) return;

        // console.log('width --->', width, height, waveformData.length);

        const dpr = window.devicePixelRatio || 1;
        // // const rect = container.getBoundingClientRect();

        // // Use actual container dimensions

        // Set canvas size accounting for device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Scale canvas back down using CSS
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // // Scale the context to match device pixel ratio
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
    }, []);



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

    useEffect(() => {
        if (waveformData && waveformData.length > 0) {
            // Small delay to ensure canvas is properly set up
            setTimeout(() => drawFinalWaveform(), 50);
        }
    }, [waveformData, drawFinalWaveform]);


    // Helper function to get position from mouse event
    const getPositionFromEvent = (e) => {

        // console.log('e --->', e)
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;

        console.log('clickX -->', clickX, rect.width)
        return clickX / rect.width;
    };

    // Enhanced handleWaveformClick with cursor support
    const handleWaveformClick = (e) => {

        const percentage = getPositionFromEvent(e);
        const newTime = audioDuration * percentage;

        // Update audio position
        audioPlayerRef.current.currentTime = newTime;

        // Update cursor position
        setCursorPosition(percentage);

        // Update waveform visual
        drawStaticBars(waveformData, percentage);
    };



    const handleMouseDown = (e) => {
        if (!audioPlayerRef.current) return;
        setIsDragging(true);

        // Pause audio while dragging
        const wasPlaying = !audioPlayerRef.current.paused;
        if (wasPlaying) {
            audioPlayerRef.current.pause();
        }

        // Handle initial position
        handleWaveformClick(e);
        wasPlayingBeforeDragRef.current = wasPlaying;
    };


    // Mouse move handler - update cursor while dragging
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !audioDuration || !audioPlayerRef.current) return;

        const percentage = getPositionFromEvent(e);
        const newTime = audioDuration * percentage;

        console.log('new_time', Math.min(newTime, audioDuration - 0.001), newTime)
        // Update audio position
        audioPlayerRef.current.currentTime = newTime;

        // Update cursor position
        setCursorPosition(percentage);

        // Update waveform visual
        drawStaticBars(waveformData, percentage);
    }, [isDragging, waveformData, audioDuration, drawStaticBars]);

    // Mouse up handler - end dragging
    const handleMouseUp = useCallback((e) => {
        if (!isDragging) return;

        setIsDragging(false);

        // Resume playing if it was playing before drag
        const wasPlaying = wasPlayingBeforeDragRef.current;
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
                console.log('im here play!!!!!')
                audioPlayerRef.current.play();
            } else {
                setRecordingState('pause');
                audioPlayerRef.current.pause();
            }
        }
    };

    // Audio player event listeners - FIXED VERSION
    useEffect(() => {
        const player = audioPlayerRef.current;
        if (!player) return;

        // Helper function to get reliable duration
        const getDuration = () => {
            return audioDuration;
        };

        const handlePlay = () => {
            setIsPlaying(true);
            // const visualize = () => {

            //     if (player.paused) return;

            //     console.log('player.currentTime --->', player.currentTime)
            //     const duration = getDuration();
            //     if (duration > 0) {
            //         const progress = player.currentTime / duration;
            //         setCursorPosition(progress);
            //         drawStaticBars(waveformData, progress);
            //     }
            //     playbackAnimationIdRef.current = requestAnimationFrame(visualize);
            // };
            // visualize();
        };

        const handlePause = () => {
            setIsPlaying(false);
            if (playbackAnimationIdRef.current) {
                cancelAnimationFrame(playbackAnimationIdRef.current);
            }
        };

        const handleEnded = () => {
            player.pause();
            player.currentTime = 0;
            setIsPlaying(false);
            setCursorPosition(0);
            drawStaticBars(waveformData, 0);
            setTimer('00:00');
        };

        const handleTimeUpdate = () => {
            if (player.paused) return
            const duration = getDuration();

            if (duration > 0) {
                const progress = player.currentTime / duration;
                setCursorPosition(progress);
                drawStaticBars(waveformData, progress);
            }

            // Update timer regardless of duration
            const elapsed = player.currentTime;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        // const handleLoadedMetadata = () => {
        //     // Initial draw when metadata is loaded
        //     if (getDuration() > 0) {
        //         drawStaticBars(waveformData, 0);
        //     }
        // };

        player.addEventListener('play', handlePlay);
        player.addEventListener('pause', handlePause);
        player.addEventListener('ended', handleEnded);
        player.addEventListener('timeupdate', handleTimeUpdate);
        // player.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            player.removeEventListener('play', handlePlay);
            player.removeEventListener('pause', handlePause);
            player.removeEventListener('ended', handleEnded);
            player.removeEventListener('timeupdate', handleTimeUpdate);
            // player.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [drawStaticBars, waveformData, audioDuration]);

    console.log('cursor--', cursorPosition, audioPlayerRef.current)
    return (

        <div
            className={cn(
                'flex items-center justify-start h-auto gap-2.5',
                className,

            )}
        >

            {isPlaying ? (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => playPauseAudio()}
                >
                    <Pause className="w-[14px]" size={14} />
                </Button>
            ) : (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => playPauseAudio()}
                >
                    <Play className="w-[14px]" size={14} />
                </Button>
            )}

            <div
                className="flex items-center justify-start h-full cursor-pointer relative"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{
                        imageRendering: 'pixelated',
                        imageRendering: '-moz-crisp-edges',
                        imageRendering: 'crisp-edges'
                    }}


                >
                </canvas>
            </div>



            <div className="relative h-6 flex items-center gap-2.5">
                <div
                    className="text-exs font-medium flex items-center justify-center text-chatBoxMe-foreground cursor-pointer"
                    onClick={() => setShowRemaining(!showRemaining)}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {!isPlaying && !showRemaining ? (
                            <motion.span
                                key="duration"
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1, type: 'spring' }}
                                exit={{ y: -5, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="relative w-7 text-center text-chatBoxMe-foreground"
                            >
                                <span className="w-7"> {formatTime(audioDuration)}</span>
                            </motion.span>
                        ) : isPlaying && !showRemaining ? (
                            <motion.span
                                key="remaining"
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1, type: 'spring' }}
                                exit={{ y: -5, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="relative w-7 text-center text-chatBoxMe-foreground"
                            >
                                <span className="w-7">{timer}</span>
                            </motion.span>
                        )

                            : (
                                <motion.span
                                    key="remaining"
                                    initial={{ y: 5, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, type: 'spring' }}
                                    exit={{ y: -5, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="relative w-7 text-center text-chatBoxMe-foreground"
                                >
                                    <span className="w-7">-{formatTime(Math.max(0, audioDuration - (audioPlayerRef.current?.currentTime || 0)))}</span>
                                </motion.span>
                            )

                        }
                    </AnimatePresence>
                </div>


                <div
                    className="rounded-md  text-xs cursor-pointer w-9 text-center text-chatBoxMe relative overflow-hidden"
                    onClick={() => updateSpeed()}
                >
                    <div className="absolute inset-0 border rounded-md border-chatBoxMe-foreground"></div>
                    <span className="w-full flex items-center justify-center text-center relative">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {speed === 1 ? (
                                <motion.span
                                    key={speed}
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, type: 'spring' }}
                                    exit={{ y: -15, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="relative w-9 text-center text-chatBoxMe-foreground"
                                >
                                    <span className="w-9">{speed} x</span>
                                </motion.span>
                            ) : speed === 1.5 ? (
                                <motion.span
                                    key={speed}
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, type: 'spring' }}
                                    exit={{ y: -15, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="relative px-1 w-full text-center text-chatBoxMe bg-chatBoxMe-foreground"
                                >
                                    <span className="w-full">{speed} x</span>
                                </motion.span>
                            ) : (
                                <motion.span
                                    key={speed}
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, type: 'spring' }}
                                    exit={{ y: -15, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    className="relative w-full px-1 text-center text-chatBoxMe bg-chatBoxMe-foreground"
                                >
                                    <span className="w-full">{speed} x</span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </span>
                </div>
            </div>
            <audio ref={audioPlayerRef} className="hidden" />
        </div>

    );
};



export default AudioPlayer;


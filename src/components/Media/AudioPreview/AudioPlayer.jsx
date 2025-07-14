'use client'

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AUDIO_WAVEFORM_OPRIONS } from '@/constants';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import PropTypes from 'prop-types';
import useWaveformCanvas from '@/hooks/useWaveformCanvas';
import useAudioPlaybackAndWaveform from '@/hooks/useAudioPlaybackAndWaveform';

const AudioPlayer = ({
    audioUrl,// required
    audioDuration,// required
    waveformData, // required
    className,
}) => {
    const canvasRef = useRef(null)
    const waveformContainerRef = useRef(null);
    const audioPlayerRef = useRef(null);

    const [showRemaining, setShowRemaining] = useState(false);
    const [speed, setSpeed] = useState(1); // 1->1.2->1.5->2

    const { setupCanvas, drawStaticBars } = useWaveformCanvas(canvasRef, waveformContainerRef);
    const {
        isPlaying,
        timer,
        isDragging,
        cursorPosition,
        playPauseAudio,
        handleMouseDown,
        formatTime,
    } = useAudioPlaybackAndWaveform(audioPlayerRef, canvasRef, audioDuration, waveformData, drawStaticBars);



    const { barWidth, barGap, height: waveformHeight } = AUDIO_WAVEFORM_OPRIONS;
    const calculatedWaveformWidth = useMemo(() => {
        if (!waveformData) return 0;
        const width = waveformData.length * (barWidth + barGap);
        return Math.min(width, AUDIO_WAVEFORM_OPRIONS.waveMaxWidth); // Use constant for max width
    }, [waveformData, barWidth, barGap]);

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

    // Fixed drawFinalWaveform function
    const drawFinalWaveform = useCallback((progress = 0) => {

        if (!waveformData || waveformData.length === 0) return;

        // const barCount = getBarCount();
        const barCount = waveformData.length;

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


    const updateSpeed = () => {
        const speeds = [1, 1.2, 1.5, 2];
        setSpeed((prevSpeed) => {
            const currentIndex = speeds.indexOf(prevSpeed);
            const nextIndex = (currentIndex + 1) % speeds.length;
            const newSpeed = speeds[nextIndex];
            if (audioPlayerRef.current) {
                audioPlayerRef.current.playbackRate = newSpeed;
            }
            return newSpeed;
        });
    };


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
                ref={waveformContainerRef}
                className="flex items-center justify-start h-full cursor-pointer relative"
                onMouseDown={handleMouseDown}
                style={{
                    cursor: isDragging ? 'grabbing' : 'pointer',
                    width: `${calculatedWaveformWidth}px`, // Apply dynamic width
                    height: waveformHeight
                }}
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
                            ) : speed === 1.2 ? (
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


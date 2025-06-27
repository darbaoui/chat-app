'use client'

import { cn } from '@/lib/utils';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AUDIO_WAVEFORM_OPRIONS } from '@/constants';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import PropTypes from 'prop-types';

const AudioPreview = ({
    audioUrl,// required
    audioDuration,// required
    className,
}) => {
    const waveformRef = useRef(null);
    // const canvasWidth = useRef(null);
    // const canvasMaxWidth = useRef(null);
    const waveformWrapper = useRef(null)


    const [canvasWidth, setCanvasWidth] = useState(null);
    const [canvasMaxWidth, setCanvasMaxWidth] = useState(null);

    const [wavesurfer, setWavesurfer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showRemaining, setShowRemaining] = useState(false);
    const [time, setTime] = useState(0);
    const [audioFinish, setAudioFinish] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialize the WaveSurfer instance
        const ws = WaveSurfer.create({
            container: waveformRef.current,
            ...AUDIO_WAVEFORM_OPRIONS,
            //   renderFunction: renderFunction,
            url: audioUrl,
        });

        ws.setPlaybackRate(1);
        setWavesurfer(ws);

        // Cleanup on component unmount
        return () => ws.destroy();
    }, [audioUrl]);

    useLayoutEffect(() => {
        if (waveformWrapper.current) {
            setCanvasMaxWidth(
                waveformWrapper.current.getBoundingClientRect().width
            )
        }
    })

    useEffect(() => {

        if (audioDuration) {
            const minDuration = audioDuration < 6 ? 6 : audioDuration;
            const maxLength = Math.floor(minDuration / 0.4);
            let width = (AUDIO_WAVEFORM_OPRIONS.barWidth + AUDIO_WAVEFORM_OPRIONS.barGap) * maxLength;
            setCanvasWidth(width)
        }

    }, [audioDuration, canvasMaxWidth]);


    useEffect(() => {
        if(canvasMaxWidth && canvasWidth)
        {
            const width = canvasWidth > canvasMaxWidth ? canvasMaxWidth : canvasWidth;
            if(width!==canvasWidth)
            {
                setCanvasWidth(width)
            }
        }
    }, [canvasWidth, canvasMaxWidth])


    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };


    useEffect(() => {
        if (wavesurfer) {
            // Play/pause on click
            wavesurfer.on('interaction', () => {
                setAudioFinish(false);
                wavesurfer.play();
            });

            wavesurfer.on('timeupdate', (currentTime) => {
                if (audioFinish) {
                    setAudioFinish(false);
                }
                setTime(currentTime);
            });


            wavesurfer.on('loading', () => {
                setIsLoading(true);
            });
            
            wavesurfer.on('ready', () => {
                setIsLoading(false);
            });

            wavesurfer.on('seeking', (currentTime) => {
                setIsPlaying(wavesurfer.isPlaying());
            });

            wavesurfer.on('finish', () => {
                setAudioFinish(true);
            });
        }
    }, [wavesurfer]);

    const onPause = () => {
        setIsPlaying(false);
        wavesurfer.pause();
    };

    const onPlay = () => {
        setIsPlaying(true);
        wavesurfer.play();
    };

    const updateSpeed = () => {
        if (speed === 2) {
        wavesurfer.setPlaybackRate(1);
        setSpeed(1);
        } else {
        const newSpeed = speed + 0.5;
        wavesurfer.setPlaybackRate(newSpeed);
        setSpeed(newSpeed);
        }
    };
    
    return (

        <div
            className={cn(
                'flex items-center justify-start h-auto gap-2.5',
                className,

            )}
        >   
        
            {isLoading ? (

                <div
                    className="rounded-full flex items-center justify-center w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                >
                    <LoaderCircle className="animate-spin text-background w-[14px]" size={14} />
                </div>
            ) : isPlaying ? (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => onPause()}
                >
                    <Pause className="w-[14px]" size={14} />
                </Button>
            ) : (
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => onPlay()}
                >
                    <Play className="w-[14px]" size={14} />
                </Button>
            )}
            <div className={cn('w-[calc(100%_-_7.5rem)]')} ref={waveformWrapper} data-width={canvasMaxWidth}>
                <div
                    ref={waveformRef}
                    style={{ width: canvasWidth }}

                ></div>
            </div>



            <div className="relative h-6 flex items-center gap-2.5">
                <div
                    className="text-exs font-medium flex items-center justify-center text-chatBoxMe-foreground cursor-pointer"
                    onClick={() => setShowRemaining(!showRemaining)}
                >
                   <AnimatePresence mode="popLayout" initial={false}>
                    {!showRemaining ? (
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
                    ) : (
                        <motion.span
                        key="remaining"
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, type: 'spring' }}
                        exit={{ y: -5, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="relative w-7 text-center text-chatBoxMe-foreground"
                        >
                        <span className="w-7">-{formatTime(audioDuration - time)}</span>
                        </motion.span>
                    )}
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



        </div>

    );
};

AudioPreview.propTypes = {
    audioUrl: PropTypes.string.isRequired,
    audioDuration: PropTypes.number.isRequired,
    className: PropTypes.string,
}

export default AudioPreview;


// Media/PlayRecordAudio.jsx

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
const PUSH_INTERVAL = 50;

const PlayRecordAudio = ({ audioBlob, waveformDataRef }) => {


    const canvasRef = useRef(null)
    const waveformContainer = useRef(null)
    const audioPlayerRef = useRef(null)
    const [timer, setTimer] = useState('00:00')
    const [recordingState, setRecordingState] = useState('pause'); // pause, playing

    const handleWaveformClick = (e) => {
        if (recordingState !== 'paused' || !audioPlayerRef.current?.duration) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        audioPlayerRef.current.currentTime = audioPlayerRef.current.duration * percentage;
    };


    const playPauseAudio = () => {

        if (audioPlayerRef.current) {
            if (audioPlayerRef.current.paused) {
                setRecordingState('play')
                audioPlayerRef.current.play();
            } else {
                setRecordingState('pause')
                audioPlayerRef.current.pause();
            }
        }
    }





    // Initial canvas setup and resize listener
    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = waveformContainer.current.getBoundingClientRect();

        console.log('rect --->', rect)
        const width = 200; //parent is 300 and timer=40px and padding is 10px (300-40-10 = 250) but width 240 works perfectly
        canvas.width = width * dpr;
        // console.log('width --->', rect)
        canvas.height = rect.height * dpr;
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
        // drawPlaybackWaveform(0);
    };


    // function setupCanvas() {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return
    //     canvas.width = waveformContainer.current.clientWidth;
    //     canvas.height = waveformContainer.current.clientHeight;
    // }


    function getBarCount() {

        const { barWidth, barGap } = AUDIO_WAVEFORM_OPRIONS
        return Math.floor(canvasRef.current.width / (barWidth + barGap));
    }

    // const drawRoundedRect = useCallback((ctx, x, y, width, height, radius) => {
    //     // if (width < 2 * radius) radius = width / 2;
    //     // if (height < 2 * radius) radius = height / 2;
    //     ctx.beginPath();
    //     ctx.moveTo(x + radius, y);
    //     ctx.arcTo(x + width, y, x + width, y + height, radius);
    //     ctx.arcTo(x + width, y + height, x, y + height, radius);
    //     ctx.arcTo(x, y + height, x, y, radius);
    //     ctx.arcTo(x, y, x + width, y, radius);
    //     ctx.closePath();
    //     ctx.fill();
    // }, []);




    function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
        ctx.fill();
    }


    function drawFinalWaveform() {
        const { waveColor } = AUDIO_WAVEFORM_OPRIONS
        const scaledData = scaleDataToFit(waveformDataRef, getBarCount());
        drawStaticBars(scaledData, waveColor);
    }


    function scaleDataToFit(data, count) {
        if (data.length <= count) return data;
        const scaled = [];
        const scale = data.length / count;
        for (let i = 0; i < count; i++) {
            const chunk = data.slice(Math.floor(i * scale), Math.floor((i + 1) * scale));
            scaled.push(chunk.length ? Math.max(...chunk) : 0);
        }
        return scaled;
    }



    function drawStaticBars(data, color, progress = 0) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        const progressIndex = Math.floor(data.length * progress);
        const { barWidth, barGap } = AUDIO_WAVEFORM_OPRIONS
        const BAR_TOTAL_WIDTH = barWidth + barGap

        const canvasHeight = canvas.height
        const canvasWidth = canvas.width

        const dpr = window.devicePixelRatio || 1;
        const { progressColor } = AUDIO_WAVEFORM_OPRIONS
        data.forEach((barHeight, i) => {
            const x = (i * BAR_TOTAL_WIDTH);
            const y = ((canvasHeight / dpr) - barHeight) / 2;
            context.fillStyle = i < progressIndex ? progressColor : color;
            drawRoundedRect(context, x, y, barWidth, barHeight, barWidth / 2);
        });
    }


    useEffect(() => {

        setupCanvas();
        window.addEventListener('resize', setupCanvas);

        return () => window.removeEventListener('resize', setupCanvas);
    }, []);


    useEffect(() => {
        drawFinalWaveform()
    }, [audioBlob, waveformDataRef])



    // Audio player event listeners
    // useEffect(() => {
    //     const player = audioPlayerRef.current;
    //     if (!player) return;

    //     const handlePlay = () => {
    //         setIsPlaying(true);
    //         const visualize = () => {
    //             if (player.paused) return;
    //             drawPlaybackWaveform(player.currentTime);
    //             playbackAnimationIdRef.current = requestAnimationFrame(visualize);
    //         };
    //         visualize();
    //     };
    //     const handlePause = () => {
    //         setIsPlaying(false);
    //         if (playbackAnimationIdRef.current) cancelAnimationFrame(playbackAnimationIdRef.current);
    //     };
    //     const handleEnded = () => {
    //         setIsPlaying(false);
    //         drawPlaybackWaveform(0);
    //     };
    //     const handleTimeUpdate = () => {
    //         if (player.paused) {
    //             drawPlaybackWaveform(player.currentTime);
    //         }
    //     };

    //     player.addEventListener('play', handlePlay);
    //     player.addEventListener('pause', handlePause);
    //     player.addEventListener('ended', handleEnded);
    //     player.addEventListener('timeupdate', handleTimeUpdate);

    //     return () => {
    //         player.removeEventListener('play', handlePlay);
    //         player.removeEventListener('pause', handlePause);
    //         player.removeEventListener('ended', handleEnded);
    //         player.removeEventListener('timeupdate', handleTimeUpdate);
    //     };
    // }, [drawPlaybackWaveform]);


    return (
        <div
            className={cn('flex items-center justify-start h-auto gap-2.5 w-full px-1')}
        >
            {
                recordingState === 'play' && <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => playPauseAudio()}
                >
                    <Pause className="w-[14px]" size={14} />
                </Button>
            }

            {
                recordingState === 'pause' &&
                <Button
                    className="rounded-full w-6.5 h-6.5 p-0 bg-chatBoxMe-foreground border-none"
                    onClick={() => playPauseAudio()}
                >
                    <Play className="w-[14px]" size={14} />
                </Button>
            }


            <div ref={waveformContainer} className="flex items-center justify-start h-6 cursor-pointer rounded-lg relative w-[224px] border border-red-500" onClick={handleWaveformClick}>
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
};

PlayRecordAudio.displayName = 'PlayRecordAudio';

export default PlayRecordAudio;
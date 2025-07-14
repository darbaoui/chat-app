// Media/PlayRecordAudio.jsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AUDIO_WAVEFORM_OPRIONS } from "@/constants";
import useWaveformCanvas from "@/hooks/useWaveformCanvas";
import useAudioPlaybackAndWaveform from "@/hooks/useAudioPlaybackAndWaveform";

const PlayRecordAudio = ({ audioBlob, waveformData }) => {


    const canvasRef = useRef(null);
    const waveformContainer = useRef(null);
    const audioPlayerRef = useRef(null);


    const [scaledData, setScaledData] = useState([]);

    const { setupCanvas, getBarCount, scaleDataToFit, drawStaticBars } = useWaveformCanvas(canvasRef, waveformContainer)

    const {
        isPlaying,
        timer,
        isDragging,
        cursorPosition,
        playPauseAudio,
        handleMouseDown,
        // You might still use this for display
    } = useAudioPlaybackAndWaveform(audioPlayerRef, canvasRef, audioPlayerRef.current?.duration, scaledData, drawStaticBars)

    useEffect(() => {
        if (!audioBlob) return;
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioPlayerRef.current) audioPlayerRef.current.src = audioUrl;

        return () => {
            URL.revokeObjectURL(audioUrl);
        };
    }, [audioBlob]);




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
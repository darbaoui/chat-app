import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom React hook to encapsulate audio playback and waveform interaction logic.
 * @param {React.RefObject<HTMLAudioElement>} audioRef - Ref to the HTML audio element.
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to the HTML canvas element for waveform interaction.
 * @param {number} audioDuration - The total duration of the audio in seconds.
 * @param {number[]} waveformData - The array of numbers representing the waveform bar heights.
 * @param {(data: number[], progress: number) => void} drawStaticBars - Function from useWaveformCanvas to draw the waveform.
 * @returns {{isPlaying: boolean, timer: string, isDragging: boolean, cursorPosition: number, playPauseAudio: () => void, handleWaveformClick: (e: React.MouseEvent) => void, handleMouseDown: (e: React.MouseEvent) => void, handleMouseMove: (e: MouseEvent) => void, handleMouseUp: (e: MouseEvent) => void, formatTime: (seconds: number) => string}}
 */
const useAudioPlaybackAndWaveform = (audioRef, canvasRef, audioDuration, waveformData, drawStaticBars) => {

    const playbackAnimationIdRef = useRef(null);
    const wasPlayingBeforeDragRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [timer, setTimer] = useState('00:00');
    const [isDragging, setIsDragging] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);

    const formatTime = useCallback((seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    }, []);


    const getValidDuration = (value) => {
        return (value && value !== Infinity && !isNaN(value)) ? value : null;
    };
    
    const getDuration = () => {

        return getValidDuration(audioDuration) || getValidDuration(audioRef.current.duration)
    }

    const getPositionFromEvent = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return 0;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        return Math.max(0, Math.min(1, clickX / rect.width));
    }, [canvasRef]);

    const handleWaveformClick = useCallback((e) => {

        const duration = getDuration()
        const percentage = getPositionFromEvent(e);
        const newTime = duration * percentage;

        audioRef.current.currentTime = newTime;
        setCursorPosition(percentage);
        drawStaticBars(waveformData, percentage);
    }, [audioRef, waveformData, drawStaticBars, getPositionFromEvent]);

    const handleMouseDown = useCallback((e) => {
        // if (!audioRef.current?.duration) return;
        setIsDragging(true);
        const wasPlaying = !audioRef.current.paused;
        if (wasPlaying) {
            audioRef.current.pause();
        }
        handleWaveformClick(e);
        wasPlayingBeforeDragRef.current = wasPlaying;
    }, [audioRef, handleWaveformClick]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        const percentage = getPositionFromEvent(e);
        const duration = getDuration();
        const newTime = duration * percentage;
        audioRef.current.currentTime = newTime;
        setCursorPosition(percentage);
        drawStaticBars(waveformData, percentage);
    }, [isDragging, audioRef, waveformData, drawStaticBars, getPositionFromEvent]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        const wasPlaying = wasPlayingBeforeDragRef.current;
        if (wasPlaying && audioRef.current) {
            audioRef.current.play();
        }
    }, [isDragging, audioRef]);


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

    const playPauseAudio = useCallback(() => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [audioRef]);


    useEffect(() => {
        const player = audioRef.current;
        if (!player) return;

        const handlePlay = () => {
            setIsPlaying(true);
            // const visualize = () => {
            //     if (player.paused) return;
            //     const duration = getDuration(); // Use prop duration if available, else player.duration
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
            if (player.paused) return;
            const duration = getDuration(); // Use prop duration if available, else player.duration
            if (duration > 0) {
                const progress = player.currentTime / duration;
                setCursorPosition(progress);
                drawStaticBars(waveformData, progress);
            }
            const elapsed = player.currentTime;
            const minutes = Math.floor(elapsed / 60);
            const seconds = Math.floor(elapsed % 60);
            setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
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
    }, [audioRef, audioDuration, waveformData, drawStaticBars]);




    return {
        isPlaying,
        timer,
        isDragging,
        cursorPosition,
        playPauseAudio,
        handleWaveformClick,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        formatTime,
    };


};


export default useAudioPlaybackAndWaveform;
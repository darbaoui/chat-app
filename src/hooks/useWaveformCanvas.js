import { useCallback, useEffect } from 'react';
import { AUDIO_WAVEFORM_OPRIONS } from '@/constants';


const useWaveformCanvas = (canvasRef, waveformContainerRef) => {
    
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = waveformContainerRef.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
    }, [canvasRef, waveformContainerRef])


        // Fixed bar count calculation
        const getBarCount = useCallback(() => {
            const canvas = canvasRef.current;
            if (!canvas) return 0;
    
            const { barWidth, barGap } = AUDIO_WAVEFORM_OPRIONS;
            const availableWidth = canvas.clientWidth; // Use clientWidth for actual display width
            return Math.floor(availableWidth / (barWidth + barGap));
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

    const drawCursor = useCallback((context, cursorX, canvasHeight) => {
        const { height: cursorHeight, waveColor: cursorColor } = AUDIO_WAVEFORM_OPRIONS;
        const cursorY = (canvasHeight - cursorHeight) / 2;
        context.fillStyle = cursorColor;
        const cursorWidth = 2;
        const cursorRadius = 1;

        const adjustedCursorX = Math.max(cursorWidth / 2, Math.min(cursorX, context.canvas.clientWidth - cursorWidth / 2));

        context.beginPath();
        context.moveTo(adjustedCursorX - cursorWidth / 2 + cursorRadius, cursorY);
        context.arcTo(adjustedCursorX + cursorWidth / 2, cursorY, adjustedCursorX + cursorWidth / 2, cursorY + cursorHeight, cursorRadius);
        context.arcTo(adjustedCursorX + cursorWidth / 2, cursorY + cursorHeight, adjustedCursorX - cursorWidth / 2, cursorY + cursorHeight, cursorRadius);
        context.arcTo(adjustedCursorX - cursorWidth / 2, cursorY + cursorHeight, adjustedCursorX - cursorWidth / 2, cursorY, cursorRadius);
        context.arcTo(adjustedCursorX - cursorWidth / 2, cursorY, adjustedCursorX + cursorWidth / 2, cursorY, cursorRadius);
        context.closePath();
        context.fill();
    }, []);


    const drawStaticBars = useCallback((data, progress = 0) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        
        if (!data || data.length === 0) return;
        
        const progressIndex = Math.floor(data.length * progress);
        
        const { barWidth, barGap, progressColor, waveColor } = AUDIO_WAVEFORM_OPRIONS;
        const BAR_TOTAL_WIDTH = barWidth + barGap;
        
        const maxValue = Math.max(...data);
        if (maxValue === 0) return;
        
        data.forEach((value, i) => {
            const x = i * BAR_TOTAL_WIDTH;
            const normalizedHeight = (value / maxValue) * canvasHeight * 0.85;
            const barHeight = Math.max(1, normalizedHeight);
            const y = (canvasHeight - barHeight) / 2;

            context.fillStyle = i < progressIndex ? progressColor : waveColor;

            if (barWidth === 1) {
                context.fillRect(x, y, barWidth, barHeight);
            } else {
                const radius = Math.min(AUDIO_WAVEFORM_OPRIONS.barRadius, barWidth / 2, barHeight / 2);
                drawRoundedRect(context, x, y, barWidth, barHeight, radius);
            }
        });

        const waveWidth = data.length * BAR_TOTAL_WIDTH
        const cursorX = progress * waveWidth;
        drawCursor(context, cursorX, canvasHeight);
    }, [canvasRef, drawRoundedRect, drawCursor]);


    useEffect(() => {
        setupCanvas();
        const handleResize = () => {
            setupCanvas();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [setupCanvas]);



    return { setupCanvas, getBarCount, scaleDataToFit, drawRoundedRect, drawCursor, drawStaticBars }
}


export default useWaveformCanvas;
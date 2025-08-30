
import React, { useRef, useEffect, memo } from 'react';

interface WaveformCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

const Waveform: React.FC = memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameId: number;
        let time = 0;
        let color = '#3B82F6'; // Default color

        const updateColor = () => {
            if(document.documentElement) {
                color = getComputedStyle(document.documentElement).getPropertyValue('--text-accent').trim() || color;
            }
        };
        
        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            updateColor();
        };
        
        const draw = () => {
            time += 0.02;
            if(!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2 * window.devicePixelRatio;
            ctx.strokeStyle = color;

            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const amplitude = (canvas.height / 3) * (0.8 - i * 0.2);
                const frequency = 1.5 + i * 0.5;
                const yOffset = canvas.height / 2;

                for (let x = 0; x < canvas.width; x++) {
                    const y = yOffset + amplitude * Math.sin((x / (50 + i * 20)) * frequency + time);
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            frameId = requestAnimationFrame(draw);
        };
        
        resize();
        draw();
        
        const observer = new MutationObserver((mutations) => {
            for(const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Theme changed, update color
                    setTimeout(updateColor, 50); // Delay to allow CSS vars to apply
                }
            }
        });

        observer.observe(document.documentElement, { attributes: true });
        window.addEventListener('resize', resize);
        
        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', resize);
            observer.disconnect();
        };
    }, []);

    return <canvas ref={canvasRef} className="waveform-canvas" />;
});


export const WaveformCard: React.FC<WaveformCardProps> = ({ icon, title, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="sapphire-card w-full h-full p-6 rounded-xl flex flex-col justify-between items-start text-left focus:border-[var(--border-accent)] outline-none overflow-hidden"
        >
            <div className="relative z-10">
                <div className="text-[var(--text-accent)] mb-4 p-3 bg-[var(--bg-tertiary)] rounded-full inline-block">
                    {icon}
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-primary)] mt-2">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
            </div>
            <Waveform />
        </button>
    );
};

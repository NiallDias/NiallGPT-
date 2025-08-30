
import React, { useRef, useEffect } from 'react';

interface InfoCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    badge?: string;
    onClick: () => void;
}

export const InfoCard: React.FC<InfoCardProps> = ({ icon, title, description, badge, onClick }) => {
    const cardRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        };

        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <button 
            ref={cardRef}
            onClick={onClick}
            className="sapphire-card w-full h-full p-6 rounded-xl flex flex-col justify-between items-start text-left focus:border-[var(--border-accent)] outline-none sidebar-grid-bg"
        >
            <div className="relative z-10">
                <div className="text-[var(--text-accent)]">
                    {icon}
                </div>
                <h3 className="font-semibold text-lg text-[var(--text-primary)] mt-4">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
            </div>
            {badge && (
                <div className="relative z-10 mt-4 text-xs font-medium text-[var(--text-secondary)]">
                    {badge}
                </div>
            )}
        </button>
    );
};
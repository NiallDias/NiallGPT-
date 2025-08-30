
import React, { useRef, useEffect } from 'react';
import { NiallGPTLogo } from '../icons/NiallGPTLogo';
import { ChatIcon } from '../icons/ChatIcon';

interface PrimaryActionCardProps {
    title: string;
    description: string;
    onClick: () => void;
}

export const PrimaryActionCard: React.FC<PrimaryActionCardProps> = ({ title, description, onClick }) => {
    
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
            className="sapphire-card w-full h-full p-6 rounded-xl flex flex-col justify-center items-start text-left focus:border-[var(--border-accent)] outline-none sidebar-grid-bg"
        >
            <div className="relative z-10 w-full flex flex-col">
                <div className="flex items-center space-x-4">
                    <NiallGPTLogo className="w-12 h-12 text-white flex-shrink-0"/>
                    <div>
                        <h2 className="font-semibold text-xl text-[var(--text-primary)]">{title}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
                    </div>
                </div>

                <div className="self-end mt-8 flex items-center text-sm font-semibold text-[var(--text-accent)]">
                    <span>Start Chat</span>
                    <ChatIcon className="w-5 h-5 ml-2" />
                </div>
            </div>
        </button>
    );
};
import React, { useState, useEffect } from 'react';
import { Fact } from '../../types';
import { generateImage } from '../../services/geminiService';

interface FactCardProps {
    fact: Fact;
    delay: number;
}

const FactCard: React.FC<FactCardProps> = ({ fact, delay }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadImage = async () => {
            try {
                const url = await generateImage(fact.imagePrompt, '16:9');
                if (isMounted) {
                    setImageUrl(url);
                }
            } catch (error) {
                console.error(`Failed to generate image for fact: "${fact.text}"`, error);
                if (isMounted) {
                    setImageUrl('https://via.placeholder.com/1280x720.png?text=Image+Generation+Failed');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
        };
    }, [fact.imagePrompt, fact.text]);

    return (
        <div 
            className="sapphire-card group relative aspect-video overflow-hidden rounded-xl cursor-pointer animate-subtle-pop-in" 
            style={{ animationDelay: `${delay}ms` }}
        >
            {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-tertiary)] animate-shimmer">
                    {/* Skeleton loader */}
                </div>
            ) : (
                <img src={imageUrl!} alt={fact.imagePrompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4">
               <p className="text-white text-sm font-semibold transform-gpu translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">{fact.text}</p>
            </div>
        </div>
    );
};

export default FactCard;

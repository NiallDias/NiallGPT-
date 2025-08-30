

import React, { useState, useEffect } from 'react';
import { Headline } from '../../types';
import { fetchLatestHeadlines, generateImage } from '../../services/geminiService';
import { NewsCardSkeleton } from './NewsCardSkeleton';

const NewsCard: React.FC<{ headline: Headline, delay: number }> = ({ headline, delay }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadImage = async () => {
            if (!isMounted) return;
            try {
                // Generate a visually appealing prompt from the title
                const imagePrompt = `Photorealistic, dramatic news-style photo representing the headline: "${headline.title}"`;
                const url = await generateImage(imagePrompt, '16:9');
                if (isMounted) setImageUrl(url);
            } catch (error) {
                console.error(`Failed to generate image for headline: "${headline.title}"`, error);
                if (isMounted) setImageUrl(`https://via.placeholder.com/800x450.png?text=${encodeURIComponent(headline.title)}`);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadImage();

        return () => { isMounted = false; };
    }, [headline.title]);

    return (
        <a 
            href={headline.uri} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="sapphire-card group relative block aspect-video w-full overflow-hidden rounded-xl animate-subtle-pop-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            {isLoading || !imageUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-tertiary)] animate-shimmer">
                    {/* Skeleton loader */}
                </div>
            ) : (
                <img 
                    src={imageUrl} 
                    alt={headline.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4">
                <h3 className="font-bold text-md text-white drop-shadow-lg">{headline.title}</h3>
                <p className="text-xs text-gray-200 mt-1 drop-shadow-md">{headline.snippet}</p>
            </div>
        </a>
    );
};

export const DashboardNews: React.FC = () => {
    const [headlines, setHeadlines] = useState<Headline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getHeadlines = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedHeadlines = await fetchLatestHeadlines();
                setHeadlines(fetchedHeadlines);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        getHeadlines();
    }, []);

    if (isLoading) {
        return (
            <div className="mt-12">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">In the News</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, index) => (
                        <NewsCardSkeleton key={index} delay={index * 100} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-card h-32 flex flex-col items-center justify-center text-center p-4 mt-12">
                <p className="text-sm text-[var(--danger-bg)]">Could not load news:</p>
                <p className="text-xs mt-1 text-[var(--text-secondary)]">{error}</p>
            </div>
        );
    }
    
    if (headlines.length === 0) {
        return null; // Don't show section if there are no headlines
    }

    return (
        <div className="mt-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">In the News</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {headlines.map((headline, index) => (
                    <NewsCard key={headline.uri} headline={headline} delay={index * 100} />
                ))}
            </div>
        </div>
    );
};

import React from 'react';

export const NewsCardSkeleton: React.FC<{ delay: number }> = ({ delay }) => (
    <div
        className="aspect-video w-full rounded-xl bg-[var(--bg-tertiary)] animate-pulse animate-subtle-pop-in"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="w-full h-full p-4 flex flex-col justify-end">
            <div className="h-4 bg-[var(--icon-hover-bg)] rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-[var(--icon-hover-bg)] rounded w-1/2"></div>
        </div>
    </div>
);

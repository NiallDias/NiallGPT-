
import React from 'react';

export const CropIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3v11.5a3.5 3.5 0 003.5 3.5h11.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 21V9.5a3.5 3.5 0 00-3.5-3.5H1.5" />
    </svg>
);

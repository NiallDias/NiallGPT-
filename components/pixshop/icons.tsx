import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M17 4.5L7 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const RetouchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.385m5.043.025a15.994 15.994 0 001.622-3.385m3.388 1.62a15.994 15.994 0 00-1.622-3.385m-5.043.025a15.994 15.994 0 01-1.622-3.385m-3.388 1.62a15.998 15.998 0 01-1.622-3.385m5.043.025a15.998 15.998 0 00-3.388-1.62m7.5 0a15.998 15.998 0 00-3.388 1.62m5.043.025a15.994 15.994 0 011.622 3.385m-5.043-.025a15.994 15.994 0 001.622 3.385m-3.388-1.62a15.994 15.994 0 001.622 3.385m-1.622-3.385a15.994 15.994 0 01-1.622 3.385m0 0a15.998 15.998 0 01-3.388 1.62m-5.043-.025a15.998 15.998 0 01-1.622-3.385m-3.388-1.62a15.998 15.998 0 01-1.622 3.385m0 0a15.994 15.994 0 001.622 3.385" />
    </svg>
);

export const CropIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const AdjustIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-6-12h12M6 15h12M4.5 9h15M7.5 6h9" />
    </svg>
);
export const SlidersIcon = AdjustIcon;

export const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M6.477 6.477a.75.75 0 001.06 1.06l1.24-1.24a.75.75 0 00-1.06-1.06L6.477 6.477zM21 12h-.01M16.477 16.477a.75.75 0 00-1.06-1.06l-1.24 1.24a.75.75 0 001.06 1.06l1.24-1.24zM12 21v-.01M4.923 16.477a.75.75 0 00-1.06 1.06l1.24 1.24a.75.75 0 001.06-1.06l-1.24-1.24zM3 12h.01M7.717 7.717a.75.75 0 00-1.06-1.06l-1.24 1.24a.75.75 0 001.06 1.06l1.24-1.24zM12 12a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
    </svg>
);
export const WandIcon = FilterIcon;

export const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </svg>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const CompareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1.5a.75.75 0 01.75.75v19.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 22.5c-3.14 0-5.366-2.02-5.91-3.692A28.32 28.32 0 0112 18c-.347 0-.693.01-1.036.03M6.75 22.5c3.14 0 5.366-2.02 5.91-3.692A28.32 28.32 0 0012 18c.347 0 .693.01 1.036.03M6.75 22.5c-3.14 0-5.366-2.02-5.91-3.692A28.32 28.32 0 016 18c-.347 0-.693.01-1.036.03" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M1.25 10.518c.203.21.41.412.624.607a11.93 11.93 0 005.116 2.924M12 1.5c3.14 0 5.366 2.02 5.91 3.692A28.32 28.32 0 0118 6c.347 0 .693-.01 1.036-.03M1.25 10.518A28.32 28.32 0 016 6c.347 0 .693-.01 1.036-.03" />
    </svg>
);

export const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

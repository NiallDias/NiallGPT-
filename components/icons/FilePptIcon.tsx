
import React from 'react';

export const FilePptIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    {/* Screen shape */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25H20.25V15.75H3.75V5.25Z" />
    {/* Stand */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75V18.75M9 18.75H15" />
    {/* Simple graph/text lines on screen */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25H16.5M7.5 10.5H13.5M7.5 12.75H10.5" />
  </svg>
);

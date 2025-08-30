import React from 'react';
import { LogoIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="flex-shrink-0 p-4 flex items-center justify-between bg-black/30 backdrop-blur-sm z-30 border-b border-gray-700">
      <div className="flex items-center space-x-3">
        <LogoIcon className="w-8 h-8 text-purple-400" />
        <h1 className="text-xl font-bold">Pixshop <span className="text-purple-400">AI</span></h1>
      </div>
      <p className="text-sm text-gray-400 hidden sm:block">AI-Powered Photo Editor</p>
    </header>
  );
};

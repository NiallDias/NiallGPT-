
import React, { useContext, useState, useEffect } from 'react';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { AppView, Fact } from '../../types';
import { WaveformCard } from './WaveformCard';
import { ChatIcon } from '../icons/ChatIcon';
import { BeakerIcon } from '../icons/BeakerIcon';
import { Squares2X2Icon } from '../icons/Squares2X2Icon';
import { ImageIcon } from '../icons/ImageIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { CalculatorIcon } from '../icons/CalculatorIcon';
import { LanguageIcon } from '../icons/LanguageIcon';
import { fetchInterestingFacts } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { DashboardNews } from './DashboardNews';
import FactCard from './FactCard';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { PaintBrushIcon } from '../icons/PaintBrushIcon';

interface ModernDashboardProps {
    onSetView: (view: AppView) => void;
}

// A single digit flipper component
const TimeDigit: React.FC<{ digit: string }> = ({ digit }) => {
    return (
        <div className="relative w-4 h-7 text-lg font-mono font-bold perspective-100">
            <span 
                key={digit} 
                className="absolute inset-0 flex items-center justify-center animate-digit-flip" 
                style={{ backfaceVisibility: 'hidden', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '3px' }}
            >
                 {digit}
            </span>
        </div>
    );
};

const AnimatedClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatTime = (t: Date) => {
        return {
            hours: t.getHours().toString().padStart(2, '0'),
            minutes: t.getMinutes().toString().padStart(2, '0'),
            seconds: t.getSeconds().toString().padStart(2, '0'),
        };
    };

    const { hours, minutes, seconds } = formatTime(time);

    return (
        <div className="flex items-center space-x-0.5 p-1 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }} aria-label={`Current time: ${time.toLocaleTimeString()}`}>
            <TimeDigit digit={hours[0]} />
            <TimeDigit digit={hours[1]} />
            <span className="font-bold text-lg animate-pulse-glow" style={{ color: 'var(--text-accent)' }}>:</span>
            <TimeDigit digit={minutes[0]} />
            <TimeDigit digit={minutes[1]} />
            <span className="font-bold text-lg animate-pulse-glow" style={{ color: 'var(--text-accent)' }}>:</span>
            <TimeDigit digit={seconds[0]} />
            <TimeDigit digit={seconds[1]} />
        </div>
    );
};

const DateTimeDisplay: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        // This timer will update the date if the user leaves the page open for a long time.
        // It updates every minute. The clock updates every second internally.
        const timerId = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000 * 60);
        return () => clearInterval(timerId);
    }, []);

    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const formattedDate = currentDate.toLocaleDateString(undefined, dateOptions);

    return (
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4">
            <p className="text-md font-medium" style={{color: 'var(--text-secondary)'}}>
                {formattedDate}
            </p>
            <AnimatedClock />
        </div>
    );
};

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ onSetView }) => {
    const { 
        userName, 
        createChatSession, 
        setActiveChatSessionId, 
        imageGallery,
        deleteFromImageGallery,
        chatSessions
    } = useContext(AppSettingsContext);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const [facts, setFacts] = useState<Fact[]>([]);
    const [factsLoading, setFactsLoading] = useState(true);
    const [factsError, setFactsError] = useState<string | null>(null);
    const displayName = userName || 'there';

    useEffect(() => {
        const loadFacts = async () => {
          try {
            setFactsLoading(true);
            setFactsError(null);
            const fetchedFacts = await fetchInterestingFacts();
            setFacts(fetchedFacts);
          } catch (e) {
            setFactsError(e instanceof Error ? e.message : 'Failed to load facts.');
          } finally {
            setFactsLoading(false);
          }
        };
    
        loadFacts();
    }, []);

    const handleStartChat = () => {
        const newSession = createChatSession();
        setActiveChatSessionId(newSession.id);
        onSetView(AppView.Chat);
    };
    
    const handleDeleteImage = (e: React.MouseEvent, imgId: string) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        setDeletingImageId(imgId);
        setTimeout(() => {
            deleteFromImageGallery(imgId);
            setDeletingImageId(null);
        }, 300); // Animation duration
    };

    const recentChats = chatSessions
        .filter(session => session.messages.length > 0)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    const handleRecentChatClick = (sessionId: string) => {
        setActiveChatSessionId(sessionId);
        onSetView(AppView.Chat);
    };

    const recentImages = imageGallery.slice(0, 8);

    return (
        <div className="w-full h-full">
            <header className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] animate-fade-in-stagger">
                    {`Hello, ${displayName}.`}
                </h1>
                <p className="text-md text-[var(--text-secondary)] mt-1 animate-fade-in-stagger" style={{ animationDelay: '100ms' }}>How can I help you today?</p>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '200ms' }}>
                    <DateTimeDisplay />
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="animate-fade-in-stagger" style={{ animationDelay: '300ms' }}>
                    <WaveformCard 
                        icon={<ChatIcon className="w-8 h-8"/>}
                        title="Start New Chat"
                        description="Engage with NiallGPT for answers and assistance."
                        onClick={handleStartChat}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '400ms' }}>
                     <WaveformCard 
                        icon={<ImageIcon className="w-8 h-8"/>}
                        title="Image Generator"
                        description="Create stunning visuals from text prompts."
                        onClick={() => onSetView(AppView.ImageGenerator)}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '500ms' }}>
                    <WaveformCard 
                        icon={<VideoCameraIcon className="w-8 h-8"/>}
                        title="Video Generator"
                        description="Bring your ideas to life with short videos."
                        onClick={() => onSetView(AppView.VideoGenerator)}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '600ms' }}>
                    <WaveformCard
                        icon={<PaintBrushIcon className="w-8 h-8"/>}
                        title="AI Photo Editor"
                        description="Retouch, filter, and modify images with AI."
                        onClick={() => onSetView(AppView.AIPhotoEditor)}
                    />
                </div>
                 <div className="animate-fade-in-stagger" style={{ animationDelay: '700ms' }}>
                    <WaveformCard 
                        icon={<LanguageIcon className="w-8 h-8"/>}
                        title="Translator"
                        description="Translate text between many languages."
                        onClick={() => onSetView(AppView.Translator)}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '800ms' }}>
                    <WaveformCard 
                        icon={<CalculatorIcon className="w-8 h-8"/>}
                        title="NiallGPT Calculator"
                        description="Solve complex math problems with AI."
                        onClick={() => onSetView(AppView.Calculator)}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '900ms' }}>
                    <WaveformCard 
                        icon={<BeakerIcon className="w-8 h-8"/>}
                        title="Code Lab"
                        description="An interactive coding environment."
                        onClick={() => onSetView(AppView.CodeLab)}
                    />
                </div>
                <div className="animate-fade-in-stagger" style={{ animationDelay: '1000ms' }}>
                     <WaveformCard 
                        icon={<Squares2X2Icon className="w-8 h-8"/>}
                        title="Explore Tools"
                        description="Discover all AI capabilities."
                        onClick={() => onSetView(AppView.AITools)}
                    />
                </div>
            </div>

            {recentChats.length > 0 && (
                <div className="mt-12 animate-fade-in-stagger" style={{ animationDelay: '1100ms' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Chats</h2>
                        <button onClick={() => onSetView(AppView.Chat)} className="text-sm font-medium text-[var(--text-accent)] hover:underline">View All Chats</button>
                    </div>
                    <div className="dashboard-card space-y-2">
                        {recentChats.map(chat => (
                            <button key={chat.id} onClick={() => handleRecentChatClick(chat.id)} className="recent-chat-item">
                                <div className="flex items-center space-x-3">
                                    <ChatIcon className="w-5 h-5 flex-shrink-0 text-[var(--text-secondary)]"/>
                                    <div className="flex-grow truncate text-left">
                                        <p className="font-medium truncate text-[var(--text-primary)]">{chat.name}</p>
                                        <p className="text-xs truncate text-[var(--text-secondary)]">
                                            {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text.replace(/(\r\n|\n|\r)/gm," ") : 'No messages yet'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {recentImages.length > 0 && (
                <div className="mt-12 animate-fade-in-stagger" style={{ animationDelay: '1200ms' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Recent Images</h2>
                        <button onClick={() => onSetView(AppView.ImageGenerator)} className="text-sm font-medium text-[var(--text-accent)] hover:underline">View Gallery</button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentImages.map(img => (
                            <div key={img.id} className={`gallery-item-container w-full aspect-square rounded-lg relative group ${deletingImageId === img.id ? 'animate-bounce-out' : ''}`}>
                                <div className="w-full h-full">
                                    <img src={img.imageUrl} alt={img.prompt} className="gallery-item-image rounded-lg"/>
                                    <div className="gallery-item-overlay rounded-lg">
                                        <p className="gallery-item-prompt">{img.prompt}</p>
                                    </div>
                                </div>
                                 <button onClick={(e) => handleDeleteImage(e, img.id)} className="dashboard-gallery-btn" title="Delete Image">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="animate-fade-in-stagger" style={{ animationDelay: '1300ms' }}>
                <DashboardNews />
            </div>

            {/* Facts for You Section */}
            <div className="mt-12 animate-fade-in-stagger" style={{ animationDelay: '1400ms' }}>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Facts for You</h2>
              {factsLoading ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">Discovering interesting facts...</p>
                </div>
              ) : factsError ? (
                <div className="dashboard-card h-32 flex flex-col items-center justify-center text-center p-4">
                  <p className="text-sm text-[var(--danger-bg)]">{factsError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {facts.map((fact, index) => (
                    <FactCard key={index} fact={fact} delay={index * 100} />
                  ))}
                </div>
              )}
            </div>
        </div>
    );
};

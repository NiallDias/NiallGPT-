import React from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { AppView } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { NiallGPTLogo } from './icons/NiallGPTLogo';

interface PolicyViewProps {
  onSetView: (view: AppView) => void;
}

export const PolicyView: React.FC<PolicyViewProps> = ({ onSetView }) => {
  const { currentTheme } = React.useContext(AppSettingsContext);
  const isRGBTheme = currentTheme.id === 'rgb';

  const sectionHeaderStyles = `text-2xl sm:text-3xl font-semibold mb-6 border-b-2 pb-3`;
  const subHeaderStyles = `text-xl font-semibold mt-6 mb-3`;
  const paragraphStyles = `mb-4 leading-relaxed`;
  const listStyles = `list-disc list-inside space-y-2 pl-4 mb-4`;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="min-h-screen overflow-y-auto p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center">
                <NiallGPTLogo className="w-12 h-12 mr-3" />
                <h1 className={`text-3xl sm:text-4xl font-bold ${isRGBTheme ? 'animate-rgb-text-shadow' : ''}`} style={{color: 'var(--text-accent)'}}>
                    Legal Information
                </h1>
            </div>
            <button 
              onClick={() => onSetView(AppView.Chat)} 
              className="mt-4 sm:mt-0 flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                backgroundColor: 'var(--button-accent-bg)',
                color: 'var(--button-accent-text)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--button-accent-hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--button-accent-bg)'}
              aria-label="Back to application"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to App
            </button>
        </header>

        <p className="text-center mb-10 text-sm" style={{color: 'var(--text-secondary)'}}>Last Updated: October 26, 2023</p>
        
        <section id="privacy-policy" className="mb-16">
            <h2 className={sectionHeaderStyles} style={{borderColor: 'var(--border-accent)', color: 'var(--text-accent)'}}>Privacy Policy</h2>
            <p className={paragraphStyles}>Your privacy is important to us. This Privacy Policy explains how NiallGPT ("we," "us," or "our") collects, uses, shares, and protects your information when you use our application. By using NiallGPT, you agree to the collection and use of information in accordance with this policy.</p>

            <h3 className={subHeaderStyles}>Information We Collect</h3>
            <p className={paragraphStyles}>We collect information to provide and improve our service. The types of information we collect include:</p>
            <ul className={listStyles}>
                <li><strong>User-Provided Information:</strong> This includes your chat messages, prompts for image generation, uploaded files (images, text files), and any custom settings you configure, such as your name or the AI's personality. This data is processed to provide the core functionality of the app.</li>
                <li><strong>Locally Stored Data:</strong> All your chat sessions, messages, and application settings are stored locally in your browser's localStorage. This data does not leave your device and is not transmitted to our servers. Resetting your browser data will permanently delete this information.</li>
                <li><strong>API Usage:</strong> Your prompts (text, images) are sent to the Google Gemini API to generate responses. We do not log or store the content of your API requests or responses on our servers. Please refer to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="themed-link">Google Privacy Policy</a> for information on how they handle data.</li>
            </ul>

            <h3 className={subHeaderStyles}>How We Use Your Information</h3>
            <p className={paragraphStyles}>The information collected is used solely for the following purposes:</p>
            <ul className={listStyles}>
                <li>To operate and maintain the NiallGPT application.</li>
                <li>To process your inputs and generate responses from the AI model.</li>
                <li>To personalize your experience based on your settings.</li>
                <li>To enable application features like chat history, image generation, and file analysis.</li>
            </ul>

            <h3 className={subHeaderStyles}>Data Storage and Security</h3>
            <p className={paragraphStyles}>Your chat history and settings are stored directly in your browser's local storage. We do not have access to this data. You are in control of this data, and it can be cleared at any time by clearing your browser's cache and site data or by using the "Reset All Settings" button in the app. While we do not store your data, we encourage you to be mindful of the personal information you share in your prompts.</p>
            
            <h3 className={subHeaderStyles}>Third-Party Services</h3>
            <p className={paragraphStyles}>NiallGPT relies on the Google Gemini API to provide its generative AI features. Your interactions are subject to Google's policies. We are not responsible for the data practices of third-party services.</p>

        </section>
        
        <section id="terms-of-service">
            <h2 className={sectionHeaderStyles} style={{borderColor: 'var(--border-accent)', color: 'var(--text-accent)'}}>Terms of Service</h2>
            <p className={paragraphStyles}>By accessing or using NiallGPT, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access the service.</p>

            <h3 className={subHeaderStyles}>Use of the Service</h3>
            <p className={paragraphStyles}>You agree to use NiallGPT in compliance with all applicable laws and regulations. You are solely responsible for the content you create, input, or upload ("User Content").</p>
            
            <h3 className={subHeaderStyles}>Prohibited Conduct</h3>
            <p className={paragraphStyles}>You agree not to use the service to:</p>
            <ul className={listStyles}>
                <li>Generate content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.</li>
                <li>Violate the rights of others, including intellectual property rights.</li>
                <li>Attempt to disrupt or interfere with the service's security or integrity.</li>
                <li>Generate or disseminate misinformation or malicious content.</li>
            </ul>

            <h3 className={subHeaderStyles}>User Content</h3>
            <p className={paragraphStyles}>You retain all ownership rights to your User Content. However, by providing User Content to the service, you grant us a temporary, non-exclusive license to use, process, and transmit your content solely for the purpose of operating the service and providing you with AI-generated responses.</p>

            <h3 className={subHeaderStyles}>Disclaimers and Limitation of Liability</h3>
            <p className={paragraphStyles}>NiallGPT is provided "as is" and "as available" without any warranties of any kind. The AI-generated content may contain inaccuracies or errors. We do not guarantee the accuracy, completeness, or usefulness of any information provided by the service. You agree that your use of the service is at your sole risk.</p>
            <p className={paragraphStyles}>In no event shall NiallGPT or its creator be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the service.</p>

            <h3 className={subHeaderStyles}>Changes to Terms</h3>
            <p className={paragraphStyles}>We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page. You are advised to review this page periodically for any changes.</p>
            
            <h3 className={subHeaderStyles}>Contact Us</h3>
            <p className={paragraphStyles}>If you have any questions about this Privacy Policy or Terms of Service, please feel free to reach out to the creator, Niall, through his social media profiles linked within the application.</p>
        </section>
      </div>
    </div>
  );
};

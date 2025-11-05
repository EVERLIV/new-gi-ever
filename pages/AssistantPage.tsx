import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeBloodTest, createChatWithContext } from '../services/geminiService';
import { apiService } from '../services/apiService';
import type { ChatMessage, Biomarker, BloodTestAnalysis } from '../types';
import { MessageSender } from '../types';
import Button from '../components/ui/Button';
import { PaperAirplaneIcon, UserCircleIcon, SparklesIcon, MicrophoneIcon, PaperClipIcon, XMarkIcon, StopCircleIcon, MagnifyingGlassIcon } from '../components/icons/IconComponents';
import { useAuth } from '../contexts/AuthContext';
import type { Chat } from '@google/genai';

// SpeechRecognition API might not be on the window type
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const MAX_CHARS = 1000;


const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });


const ChatMessageBubble: React.FC<{ message: ChatMessage; searchQuery?: string }> = ({ message, searchQuery = '' }) => {
    const isUser = message.sender === MessageSender.USER;
    const isAiTyping = !isUser && message.text === '' && !message.image;
    
    const highlightText = (text: string, highlight: string): string => {
        if (!highlight.trim()) {
            return text.replace(/\n/g, '<br />');
        }
        try {
            // Escape special regex characters from the user input
            const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedHighlight})`, 'gi');
            const highlightedText = text.replace(regex, `<mark class="bg-yellow-200 text-black rounded px-1">$1</mark>`);
            return highlightedText.replace(/\n/g, '<br />');
        } catch (e) {
            console.error("Error creating regex for highlighting:", e);
            // Fallback to no highlighting on regex error
            return text.replace(/\n/g, '<br />');
        }
    };

    return (
        <div className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            {!isUser && 
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-soft">
                    <SparklesIcon className="h-6 w-6 text-white" />
                </div>
            }
            <div className={`max-w-xl rounded-2xl shadow-soft ${isUser ? 'bg-gradient-to-br from-primary to-primary-light text-white rounded-br-lg' : 'bg-surface text-on-surface rounded-bl-lg border border-gray-200/60'}`}>
                 {isAiTyping ? (
                    <div className="flex items-center space-x-1.5 p-3 px-4">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                 ) : (
                    <div className="p-3 px-4">
                        {message.image && <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-xs" />}
                        <div className="prose prose-sm max-w-none prose-p:my-2" dangerouslySetInnerHTML={{ __html: highlightText(message.text, searchQuery) }} />
                    </div>
                 )}
            </div>
             {isUser && 
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircleIcon className="h-7 w-7 text-gray-500" />
                </div>
            }
        </div>
    );
};

const AssistantPage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ file: File, previewUrl: string } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    
    const chatRef = useRef<Chat | null>(null);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const latestAnalysisRef = useRef<BloodTestAnalysis | null>(null);

    useEffect(() => {
        const initializeChat = async () => {
            try {
                const [chatHistory, biomarkers] = await Promise.all([
                    apiService.getChatHistory(),
                    apiService.getBiomarkers()
                ]);

                const initialMessages = chatHistory.length > 0 ? chatHistory : [{ sender: MessageSender.AI, text: t('assistant.initialMessage') }];
                setMessages(initialMessages);

                chatRef.current = createChatWithContext(user, biomarkers);
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                setMessages([{ sender: MessageSender.AI, text: "Sorry, I'm having trouble connecting. Please try again later." }]);
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;
                recognitionRef.current.interimResults = true;
                recognitionRef.current.lang = 'ru-RU';
                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                     if (finalTranscript) {
                        setInput(currentInput => (currentInput + ' ' + finalTranscript).trim());
                    }
                };
            }
            setIsInitialized(true);
        };
        
        initializeChat();

        return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
    }, [user, t]);

    useEffect(() => {
        const handler = setTimeout(() => {
             if (isInitialized && messages.length > 0) {
                apiService.saveChatHistory(messages);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [messages, isInitialized]);
    
    useEffect(() => {
        if (!searchQuery) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, searchQuery]);


    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const formatAnalysisForChat = useCallback((analysis: BloodTestAnalysis): string => {
        const buttonClasses = "inline-flex items-center justify-center px-4 py-2 mt-4 border border-transparent text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:opacity-60";
        const biomarkersList = analysis.biomarkers.map(b => 
            `<li class="py-1"><strong>${b.name}:</strong> ${b.value} ${b.unit} <span class="text-xs capitalize">(${b.status})</span></li>`
        ).join('');

        return `
            <p>Я проанализировал ваш отчет об анализе крови. Вот краткое изложение:</p>
            <div class="mt-2 p-3 bg-white rounded-md">
                <p><strong>Резюме от ИИ:</strong> ${analysis.summary}</p>
                <strong class="block mt-3">Ключевые биомаркеры:</strong>
                <ul class="list-disc list-inside mt-1">${biomarkersList}</ul>
            </div>
            <p class="mt-3">Хотите сохранить эти результаты в свою историю биомаркеров?</p>
            <button id="save-analysis-btn" class="${buttonClasses}">${t('assistant.saveAnalysis')}</button>
        `;
    }, [t]);

    const handleSaveResults = useCallback(async () => {
        const analysis = latestAnalysisRef.current;
        if (!analysis) return;

        try {
            await apiService.saveTestResult(analysis);
            
            const saveButton = document.getElementById('save-analysis-btn');
            if (saveButton) {
                saveButton.id = ''; 
                (saveButton as HTMLButtonElement).disabled = true;
                saveButton.innerHTML = t('assistant.savedAnalysis');
            }

        } catch (e) {
            console.error("Failed to save biomarkers:", e);
            const saveButton = document.getElementById('save-analysis-btn');
            if (saveButton) {
                saveButton.textContent = t('common.error');
            }
        }
    }, [t]);

    const handleBloodTestAnalysis = useCallback(async (file: File | undefined) => {
        if (!file) {
            setMessages(prev => [...prev.slice(0, -2), { sender: MessageSender.AI, text: "Извините, для анализа нужно прикрепить изображение." }]);
            return;
        }

        setMessages(prev => [...prev.slice(0, -2), { sender: MessageSender.AI, text: t('assistant.analysisMessage') }]);
        
        try {
            const base64Image = await fileToBase64(file);
            const analysis = await analyzeBloodTest(base64Image, file.type);
            latestAnalysisRef.current = analysis;
            const formattedHtml = formatAnalysisForChat(analysis);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = formattedHtml;
                return newMessages;
            });
        } catch (error) {
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = t('assistant.analysisError');
                return newMessages;
            });
        }
    }, [formatAnalysisForChat, t]);

    useEffect(() => {
        const chatContainer = document.getElementById('chat-container');
        
        const handleChatClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.id === 'save-analysis-btn') {
                target.textContent = t('assistant.savingAnalysis');
                target.setAttribute('disabled', 'true');
                handleSaveResults();
            }
        };

        chatContainer?.addEventListener('click', handleChatClick);
        return () => chatContainer?.removeEventListener('click', handleChatClick);
    }, [handleSaveResults, t]);

    const handleSend = useCallback(async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage: ChatMessage = { sender: MessageSender.USER, text: input, image: selectedImage?.previewUrl };
        setMessages(prev => [...prev, userMessage, { sender: MessageSender.AI, text: '' }]);
        
        const currentInput = input;
        const currentImageFile = selectedImage?.file;

        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const chat = chatRef.current;
            if (!chat) throw new Error("Chat not initialized");

            const messageParts: (string | { inlineData: { mimeType: string, data: string }})[] = [currentInput];

            if (currentImageFile) {
                const base64Image = await fileToBase64(currentImageFile);
                messageParts.push({ inlineData: { mimeType: currentImageFile.type, data: base64Image }});
            }
            
            const responseStream = await chat.sendMessageStream({ message: messageParts });

            let fullResponse = '';
            for await (const chunk of responseStream) {
                fullResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.sender === MessageSender.AI) {
                        lastMessage.text = fullResponse;
                    }
                    return newMessages;
                });
            }

            if (fullResponse.trim() === '[ANALYZE_BLOOD_TEST]') {
                await handleBloodTestAnalysis(currentImageFile);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.sender === MessageSender.AI) {
                    lastMessage.text = t('assistant.generalError');
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, selectedImage, handleBloodTestAnalysis, t]);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage({ file, previewUrl: URL.createObjectURL(file) });
        }
    };
    
    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const filteredMessages = searchQuery
        ? messages.filter(msg =>
            msg.text.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : messages;

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200/80 bg-background/80 backdrop-blur-sm">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        name="search"
                        id="search"
                        className="block w-full rounded-xl border-gray-300 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2 bg-surface text-on-surface"
                        placeholder={t('assistant.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            aria-label={t('assistant.clearSearch')}
                        >
                            <XMarkIcon className="h-5 w-5 text-on-surface-variant hover:text-on-surface" />
                        </button>
                    )}
                </div>
            </div>

            <div id="chat-container" className="flex-grow p-4 sm:p-6 overflow-y-auto">
                <div className="space-y-6">
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map((msg, index) => <ChatMessageBubble key={index} message={msg} searchQuery={searchQuery} />)
                    ) : (
                        searchQuery && (
                            <div className="text-center py-10 text-on-surface-variant">
                                <MagnifyingGlassIcon className="mx-auto h-12 w-12 opacity-50" />
                                <p className="mt-4 font-semibold">{t('assistant.noResults', { query: searchQuery })}</p>
                                <p className="text-sm">{t('assistant.noResultsHint')}</p>
                            </div>
                        )
                    )}
                     {!isInitialized && (
                        <div className="flex items-start gap-3 w-full justify-start">
                             <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-soft">
                                <SparklesIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="max-w-xl rounded-2xl shadow-soft bg-surface text-on-surface rounded-bl-lg border border-gray-200/60">
                                <div className="flex items-center space-x-1.5 p-3 px-4">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200/80 bg-background/80 backdrop-blur-sm">
                <div className="bg-surface rounded-xl shadow-soft border border-gray-200/60 flex items-center p-2 gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
                    <button 
                        title={t('assistant.attachImage')}
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isLoading} 
                        className="p-2 rounded-full text-on-surface-variant hover:bg-gray-100 transition-colors disabled:opacity-50 flex-shrink-0"
                        aria-label={t('assistant.attachImage')}>
                        <PaperClipIcon className="h-6 w-6" />
                    </button>
                    <button 
                        title={isRecording ? t('assistant.stopRecording') : t('assistant.startRecording')}
                        onClick={toggleRecording} 
                        disabled={isLoading} 
                        className={`p-2 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${isRecording ? 'text-red-500 bg-red-100' : 'text-on-surface-variant hover:bg-gray-100'}`} 
                        aria-label={isRecording ? t('assistant.stopRecording') : t('assistant.startRecording')}>
                        {isRecording ? <StopCircleIcon className="h-6 w-6"/> : <MicrophoneIcon className="h-6 w-6" />}
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        className="flex-1 block w-full bg-transparent resize-none max-h-40 p-1 border-0 focus:ring-0 sm:text-sm placeholder-on-surface-variant text-on-surface"
                        placeholder={isRecording ? t('assistant.listening') : t('assistant.inputPlaceholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                        disabled={isLoading || !isInitialized}
                    />
                    <Button 
                        onClick={handleSend} 
                        isLoading={isLoading} 
                        disabled={(!input.trim() && !selectedImage) || !isInitialized} 
                        className="h-10 w-10 p-0 flex-shrink-0 rounded-lg" 
                        aria-label={t('assistant.sendMessage')}
                        title={t('assistant.sendMessage')}>
                       {!isLoading && <PaperAirplaneIcon className="h-5 w-5" />}
                    </Button>
                </div>
                {selectedImage && (
                    <div className="text-xs text-on-surface-variant mt-2 px-2 flex justify-between items-center">
                       <span>{t('assistant.imageAttached')} <span className="font-medium text-on-surface">{selectedImage.file.name}</span></span>
                       <button onClick={() => setSelectedImage(null)} className="p-1 rounded-full hover:bg-red-100">
                           <XMarkIcon className="h-4 w-4 text-red-600" />
                       </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssistantPage;
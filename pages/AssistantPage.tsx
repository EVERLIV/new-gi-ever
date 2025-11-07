import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeBloodTest, createChatWithContext } from '../services/geminiService';
import { apiService } from '../services/apiService';
import type { ChatMessage, Biomarker, BloodTestAnalysis } from '../types';
import { MessageSender } from '../types';
import Button from '../components/ui/Button';
import { ArrowUpIcon, SparklesIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ClockIcon, ChevronDownIcon } from '../components/icons/IconComponents';
import { useAuth } from '../contexts/AuthContext';
import type { Chat } from '@google/genai';

const MAX_CHARS = 1152;


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


const ChatMessageBubble: React.FC<{ message: ChatMessage; searchQuery?: string; id: string; }> = ({ message, searchQuery = '', id }) => {
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
        <div id={id} className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    const [useProfileContext, setUseProfileContext] = useState(true);
    const [useBiomarkersContext, setUseBiomarkersContext] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const latestAnalysisRef = useRef<BloodTestAnalysis | null>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const initializeChat = async () => {
            setIsInitialized(false);
            try {
                const [chatHistory] = await Promise.all([
                    apiService.getChatHistory(),
                ]);

                const biomarkers = useBiomarkersContext ? await apiService.getBiomarkers() : [];
                
                const userForContext = { ...user };
                if (!useProfileContext) {
                    delete userForContext.healthProfile;
                }

                const latestInitialMessage = t('assistant.initialMessage');
                let messagesToSet;

                const oldEnglishMessage = "Hello! I'm your AI Health Assistant. I can now analyze blood test reports directly from our chat. How can I help you today?";

                if (chatHistory.length > 0 && chatHistory[0].sender === MessageSender.AI && chatHistory[0].text === oldEnglishMessage) {
                    chatHistory[0].text = latestInitialMessage;
                    messagesToSet = chatHistory;
                } else if (chatHistory.length > 0) {
                    messagesToSet = chatHistory;
                } else {
                    messagesToSet = [{ sender: MessageSender.AI, text: latestInitialMessage }];
                }

                setMessages(messagesToSet);
                chatRef.current = createChatWithContext(userForContext, biomarkers);
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                setMessages([{ sender: MessageSender.AI, text: "Sorry, I'm having trouble connecting. Please try again later." }]);
            }
            setIsInitialized(true);
        };
        
        initializeChat();
    }, [user, t, useProfileContext, useBiomarkersContext]);
    
    // Effect to handle closing dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
                setIsHistoryOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
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
        // Reset file input value to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const messagesWithOriginalIndex = messages.map((msg, index) => ({ ...msg, originalIndex: index }));
    const displayedMessages = searchQuery
        ? messagesWithOriginalIndex.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
        : messagesWithOriginalIndex;

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Hidden file input for image attachments */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
                accept="image/png, image/jpeg"
            />

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
                    {displayedMessages.length > 0 ? (
                        displayedMessages.map((msg) => <ChatMessageBubble key={msg.originalIndex} id={`message-${msg.originalIndex}`} message={msg} searchQuery={searchQuery} />)
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
                 <div className="bg-gray-100 rounded-2xl p-3 max-w-3xl mx-auto flex flex-col gap-2 shadow-soft-md border border-gray-200/80">
                    {selectedImage && (
                        <div className="px-1 pt-1">
                            <div className="relative inline-block">
                                <img src={selectedImage.previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg"/>
                                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors">
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                     <textarea
                        ref={textareaRef}
                        rows={1}
                        className="block w-full bg-transparent resize-none max-h-40 px-2 py-1 border-0 focus:ring-0 sm:text-sm placeholder-on-surface-variant/80 text-on-surface"
                        placeholder={t('assistant.replyPlaceholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && (input.trim() || selectedImage)) { e.preventDefault(); handleSend(); }}}
                        disabled={isLoading || !isInitialized}
                    />
                    <div className="flex items-center justify-between gap-2">
                        <div ref={controlsRef} className="flex items-center gap-1.5 relative">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/60 border border-gray-300/70 text-on-surface-variant hover:bg-white/90 hover:border-gray-400 transition-colors disabled:opacity-50"
                                disabled={isLoading || !isInitialized}
                                aria-label={t('assistant.attachImage')}
                                title={t('assistant.attachImage')}
                            >
                                <PlusIcon className="h-5 w-5"/>
                            </button>
                             <button onClick={() => setIsSettingsOpen(prev => !prev)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/60 border border-gray-300/70 text-on-surface-variant hover:bg-white/90 hover:border-gray-400 transition-colors disabled:opacity-50" disabled={isLoading || !isInitialized}><AdjustmentsHorizontalIcon className="h-5 w-5"/></button>
                             <button onClick={() => setIsHistoryOpen(prev => !prev)} className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/60 border border-gray-300/70 text-on-surface-variant hover:bg-white/90 hover:border-gray-400 transition-colors disabled:opacity-50" disabled={isLoading || !isInitialized}><ClockIcon className="h-5 w-5"/></button>
                        
                            {isSettingsOpen && (
                                <div className="absolute bottom-full mb-2 w-64 bg-surface text-on-surface rounded-lg shadow-lg p-2 z-10 animate-fadeIn border border-gray-200">
                                    <label className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer">
                                        <span className="text-sm font-medium">Использовать профиль</span>
                                        <input type="checkbox" checked={useProfileContext} onChange={e => setUseProfileContext(e.target.checked)} className="sr-only peer" />
                                        <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                    <label className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer">
                                        <span className="text-sm font-medium">Использовать биомаркеры</span>
                                        <input type="checkbox" checked={useBiomarkersContext} onChange={e => setUseBiomarkersContext(e.target.checked)} className="sr-only peer" />
                                        <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            )}

                             {isHistoryOpen && (
                                <div className="absolute bottom-full mb-2 w-64 bg-surface text-on-surface rounded-lg shadow-lg p-4 z-10 animate-fadeIn border border-gray-200">
                                    <p className="text-sm text-center">История чата скоро появится.</p>
                                </div>
                            )}
                        </div>
                       
                        <div className="flex items-center gap-3">
                             <div className="hidden sm:flex items-center gap-1 text-sm text-on-surface-variant/80 cursor-default">
                                <span>Gemini 2.5</span>
                                <ChevronDownIcon className="h-4 w-4"/>
                            </div>
                            <Button
                                onClick={handleSend}
                                isLoading={isLoading}
                                disabled={isLoading || !isInitialized || (!input.trim() && !selectedImage)}
                                className="bg-on-surface-variant hover:bg-on-surface text-white rounded-md h-9 w-9 p-0 flex-shrink-0"
                                aria-label={t('assistant.sendMessage')}
                                title={t('assistant.sendMessage')}
                            >
                                <ArrowUpIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-on-surface-variant text-center mt-2 px-4 max-w-3xl mx-auto">
                    {t('assistant.disclaimer')}
                </p>
            </div>
        </div>
    );
};

export default AssistantPage;
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SparklesIcon, ArrowUpIcon, Bars3Icon, XMarkIcon, DocumentArrowUpIcon, UserGroupIcon, BookOpenIcon } from '../components/icons/IconComponents';
import { GoogleGenAI, Chat } from '@google/genai';
import { MessageSender, ChatMessage } from '../types';
import Button from '../components/ui/Button';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MAX_CHARS = 1152;

const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.sender === MessageSender.USER;
    const isAiTyping = !isUser && message.text === '';
    
    return (
        <div className={`flex items-start gap-3 w-full max-w-2xl mx-auto ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`rounded-2xl shadow-soft ${isUser ? 'bg-primary text-white rounded-br-lg' : 'bg-surface text-on-surface rounded-bl-lg border border-gray-200/60'}`}>
                 {isAiTyping ? (
                    <div className="flex items-center space-x-1.5 p-3 px-4">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                    </div>
                 ) : (
                    <div className="p-3 px-4">
                        {message.image && <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-xs" />}
                        <div className="prose prose-sm max-w-none prose-p:my-2" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }} />
                    </div>
                 )}
            </div>
        </div>
    );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; text: string; onClick: () => void; isCurrent?: boolean }> = ({ to, icon, text, onClick, isCurrent=false }) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`flex items-center p-3 text-lg font-semibold rounded-lg transition-colors ${isCurrent ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-gray-100 hover:text-primary'}`}
    >
        {icon}
        <span className="ml-4">{text}</span>
    </Link>
);


const LandingPage: React.FC = () => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userMessageCount, setUserMessageCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const USER_MESSAGE_LIMIT = 3;

    useEffect(() => {
        chatSessionRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `Вы — EVERLIV HEALTH, ИИ-ассистент по здоровью. Ваша задача — напрямую отвечать на вопросы пользователя о здоровье и благополучии.

                **ПРАВИЛА ОБРАБОТКИ ИЗОБРАЖЕНИЙ:**
                1.  **Медицинские изображения (кроме анализов крови):** Если пользователь загружает изображение кожной сыпи, родинки, травмы и т.п., вы ДОЛЖНЫ вежливо отказаться от анализа и немедленно посоветовать обратиться к врачу. Скажите: "Как ИИ, я не могу ставить диагноз по таким изображениям. Пожалуйста, покажите это врачу для точной оценки."
                2.  **Анализы крови:** Если изображение похоже на отчет об анализе крови, ответьте: "Это похоже на анализ крови. Для детального разбора с сохранением результатов и отслеживанием биомаркеров, пожалуйста, зарегистрируйтесь и воспользуйтесь нашей функцией 'Анализ крови (ИИ)'. Это позволит мне дать более точный и полезный ответ."
                3.  **Другие изображения:** На общие, немедицинские изображения отвечайте как обычно.
                
                **ОБЩЕЕ ПОВЕДЕНИЕ:**
                - Предоставляйте полезные, но не медицинские советы.
                - Ваш тон дружелюбный и профессиональный. 
                - Ответы должны быть краткими. 
                - Не начинайте разговор с приветствия, сразу переходите к ответу на вопрос пользователя. 
                - Всегда отвечайте на русском языке.`,
            },
        });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading || userMessageCount >= USER_MESSAGE_LIMIT || !termsAgreed) return;

        const userMessage: ChatMessage = { sender: MessageSender.USER, text: input };
        const currentInput = input;

        setInput('');
        setMessages(prev => [...prev, userMessage]);
        const newCount = userMessageCount + 1;
        setUserMessageCount(newCount);

        if (newCount >= USER_MESSAGE_LIMIT) {
            setMessages(prev => [...prev, { sender: MessageSender.AI, text: `
                <div class="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 class="font-bold text-primary">${t('landing.limitReachedTitle')}</h4>
                    <p class="mt-1">${t('landing.limitReachedText')}</p>
                    <div class="mt-4 flex gap-3">
                        <a href="#/login" class="inline-block px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark">${t('landing.login')}</a>
                        <a href="#/login" class="inline-block px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-on-surface-variant hover:bg-gray-300">${t('landing.register')}</a>
                    </div>
                </div>
            ` }]);
        } else {
            setIsLoading(true);
            setMessages(prev => [...prev, { sender: MessageSender.AI, text: '' }]);

            try {
                if (!chatSessionRef.current) throw new Error("Chat not initialized");
                
                const responseStream = await chatSessionRef.current.sendMessageStream({ message: currentInput });
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
            } catch (error) {
                console.error("Error getting AI response:", error);
                setMessages(prev => prev.slice(0, -1)); // Remove typing indicator
                setMessages(prev => [...prev, { sender: MessageSender.AI, text: t('assistant.generalError') }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="h-screen bg-gradient-to-br from-primary/5 via-white to-white flex flex-col">
             {/* Header */}
            <header className="flex-shrink-0 sticky top-0 z-20 bg-white/80 backdrop-blur-sm p-4 border-b border-gray-200/80 flex justify-between items-center">
                <Link to="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                    <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Logo" className="h-8 w-8" />
                    <span className="text-2xl font-extrabold text-primary ml-2">EVERLIV</span>
                </Link>
                <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md hover:bg-gray-200" aria-label="Открыть меню">
                    <Bars3Icon className="h-7 w-7 text-on-surface-variant" />
                </button>
            </header>

            {/* Sidebar Overlay */}
            <div className={`fixed inset-0 z-30 transition-opacity duration-300 ${isSidebarOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
            
            {/* Sidebar Content */}
            <aside className={`fixed top-0 left-0 h-full w-full max-w-xs bg-surface shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="p-4 flex justify-between items-center border-b">
                    <div className="flex items-center">
                        <img src="https://www.everlivhealth.online/assets/logo_1756364617629-BwNFO1aW.png" alt="Everliv Logo" className="h-8 w-8" />
                        <span className="text-2xl font-extrabold text-primary ml-2">EVERLIV</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100" aria-label="Закрыть меню">
                        <XMarkIcon className="h-7 w-7 text-on-surface-variant" />
                    </button>
                </div>
                <nav className="p-4 space-y-2 flex-grow">
                    <NavItem to="/" icon={<SparklesIcon className="h-6 w-6"/>} text="Новая консультация" onClick={() => setIsSidebarOpen(false)} isCurrent={true} />
                    <NavItem to="/login" icon={<DocumentArrowUpIcon className="h-6 w-6"/>} text="Загрузить Анализы" onClick={() => setIsSidebarOpen(false)} />
                    <NavItem to="/login" icon={<UserGroupIcon className="h-6 w-6"/>} text="Специалисты" onClick={() => setIsSidebarOpen(false)} />
                    <NavItem to="/login" icon={<BookOpenIcon className="h-6 w-6"/>} text="Статьи и здоровье" onClick={() => setIsSidebarOpen(false)} />
                </nav>
                <div className="p-4 border-t">
                    <Link to="/login" onClick={() => setIsSidebarOpen(false)} className="w-full">
                        <Button className="w-full justify-center text-base py-3">
                            Зарегистрироваться
                        </Button>
                    </Link>
                </div>
            </aside>

            <main className="flex-grow w-full flex flex-col overflow-y-auto min-h-0">
                <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-4 flex flex-col flex-grow">
                    {messages.length === 0 ? (
                        <>
                            {/* Welcome Text */}
                            <div className="w-full text-center animate-fadeIn">
                                <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4">{t('landing.title')}</h1>
                                <p className="text-lg text-on-surface-variant">{t('landing.subtitle1')}</p>
                                <p className="text-lg text-on-surface-variant">{t('landing.subtitle2')}</p>
                            </div>
                            {/* Spacer */}
                            <div className="flex-grow" />
                            {/* Initial AI Question */}
                            <div className="space-y-6">
                                <div className={`flex items-start gap-3 w-full justify-start animate-fadeIn`}>
                                    <div className={`rounded-2xl shadow-soft bg-surface text-on-surface rounded-bl-lg border border-gray-200/60`}>
                                        <div className="p-3 px-4">
                                            <div className="prose prose-sm max-w-none prose-p:my-2">
                                                <p>{t('landing.subtitle4')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, index) => <ChatMessageBubble key={index} message={msg} />)}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
             <footer className="flex-shrink-0 pt-4 border-t border-gray-200/80 bg-white/50 backdrop-blur-sm px-4 pb-4">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-2 px-2">
                        <label className="flex items-center text-sm text-on-surface-variant cursor-pointer">
                            <input
                                type="checkbox"
                                checked={termsAgreed}
                                onChange={() => setTermsAgreed(!termsAgreed)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="ml-2">{t('assistant.termsAgreement')}</span>
                        </label>
                    </div>
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            className="block w-full bg-surface rounded-xl shadow-soft border border-gray-300/80 p-3 pr-14 sm:text-sm placeholder-on-surface-variant text-on-surface focus:ring-primary focus:border-primary"
                            placeholder={t('landing.placeholder')}
                            value={input}
                            onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                            onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { e.preventDefault(); handleSend(); }}}
                            disabled={isLoading || userMessageCount >= USER_MESSAGE_LIMIT || !termsAgreed}
                        />
                        <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                            <Button
                                onClick={handleSend}
                                isLoading={isLoading}
                                disabled={isLoading || !input.trim() || userMessageCount >= USER_MESSAGE_LIMIT || !termsAgreed}
                                variant="primary"
                                className="h-10 w-10 p-0 flex-shrink-0 rounded-full"
                                aria-label={t('assistant.sendMessage')}
                                leftIcon={<ArrowUpIcon className="h-5 w-5" />}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-on-surface-variant text-center mt-2 px-4">
                        {t('assistant.disclaimer')}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
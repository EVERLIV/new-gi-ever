import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { generateMeditationAudio } from '../services/geminiService';
import { MoonIcon, SparklesIcon, XMarkIcon } from '../components/icons/IconComponents';

interface Meditation {
    id: string;
    title: string;
    duration: string;
    summary: string;
    category: 'Фокус' | 'Релакс' | 'Сон' | 'Утро';
    imageUrl: string;
    script: string;
}

const getMeditations = (t: (key: string) => string): Meditation[] => [
    {
        id: 'morning-gratitude',
        title: 'Утренняя благодарность',
        duration: '3 мин',
        category: 'Утро',
        summary: 'Начните свой день с позитивного настроя, сосредоточившись на том, за что вы благодарны.',
        imageUrl: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=1280&auto=format&fit=crop',
        script: `Говорите спокойно и медленно с паузами: Добро пожаловать на вашу медитацию 'Утренняя благодарность'. Найдите удобное сидячее положение... Мягко закройте глаза... Сделайте глубокий вдох... и медленно выдохните... Обратите внимание на свое тело. Почувствуйте опору под собой... Теперь, вспомните одну вещь, за которую вы благодарны этим утром. Это может быть что-то маленькое. Теплая постель... пение птиц... чашка чая... Удерживайте это чувство благодарности в своем сердце. Позвольте ему наполнить вас теплом... Затем, подумайте об одном человеке в вашей жизни, которому вы благодарны. Представьте его в своем уме. Пошлите ему свою благодарность и теплые пожелания... Наконец, обратите внимание на себя. Будьте благодарны своему телу, этому дыханию, этому новому дню... Сделайте еще один глубокий вдох, полностью наполняя легкие... и на выдохе медленно откройте глаза. Несите эту благодарность с собой в течение дня.`
    },
    {
        id: 'mindful-breathing',
        title: 'Осознанное дыхание',
        duration: '5 мин',
        category: 'Релакс',
        summary: 'Простое, но мощное упражнение, чтобы закрепиться в настоящем моменте.',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-4e05860f5d58?q=80&w=1280&auto=format&fit=crop',
        script: `Говорите спокойно и медленно с паузами: Начнем нашу практику 'Осознанное дыхание'. Сядьте удобно, спина прямая, но расслабленная. Мягко закройте глаза... Положите руки на колени. В течение следующих нескольких минут мы будем просто сосредоточены на дыхании... Обратите внимание на ощущение дыхания. Заметьте, как воздух входит в ваши ноздри... прохлада... и более теплый воздух на выдохе... Не пытайтесь изменить свое дыхание. Просто наблюдайте за его естественным ритмом... Ваш ум будет блуждать. Это нормально. Когда вы заметите, что ваши мысли уходят, мягко и без осуждения верните свое внимание к дыханию... Вдох... и выдох... Почувствуйте, как ваш живот поднимается и опускается с каждым вдохом... Это дыхание — ваш якорь в настоящем моменте... Продолжайте так еще несколько циклов... По мере того как мы подходим к концу, сделайте последний, глубокий вдох... и медленно, когда будете готовы, откройте глаза. Заметьте, как вы себя чувствуете.`
    },
    {
        id: 'focus-boost',
        title: 'Усиление фокуса',
        duration: '5 мин',
        category: 'Фокус',
        summary: 'Отточите свою концентрацию и очистите ум перед выполнением задачи.',
        imageUrl: 'https://images.unsplash.com/photo-1516880711640-ef7db81602c6?q=80&w=1280&auto=format&fit=crop',
        script: `Говорите четко и спокойно с паузами: Добро пожаловать на медитацию 'Усиление фокуса'. Сядьте прямо и бодро, но расслабленно. Закройте глаза... Сделайте три глубоких, очищающих вдоха. Вдохните через нос... и выдохните через рот... Еще раз... Последний раз... Теперь позвольте вашему дыханию вернуться к своему естественному ритму. Представьте перед собой одну точку света... Сосредоточьте свое внимание на этой точке света. Она может быть любого цвета, какой вы выберете... На вдохе представляйте, как свет становится ярче, четче... На выдохе — как он становится более сфокусированным, более стабильным... Если ваш ум отвлекается, просто отметьте мысль и мягко верните свое внимание к свету... Это практика концентрации. Каждый раз, когда вы возвращаете свой ум, вы укрепляете свой фокус... Оставайтесь с этой яркой точкой света... Теперь позвольте свету медленно угаснуть. Сделайте последний глубокий вдох... и откройте глаза, готовые направить это сфокусированное внимание на вашу следующую задачу.`
    },
    {
        id: 'winding-down',
        title: 'Расслабление перед сном',
        duration: '8 мин',
        category: 'Сон',
        summary: 'Отпустите дневное напряжение и подготовьте свой ум и тело к спокойному сну.',
        imageUrl: 'https://images.unsplash.com/photo-1444210971048-6a3006adbe44?q=80&w=1280&auto=format&fit=crop',
        script: `Говорите очень спокойно, медленно и мягко с длинными паузами: Приготовьтесь ко сну... Лягте удобно в своей кровати. Закройте глаза... и отпустите прошедший день... Сделайте мягкий вдох... и долгий, медленный выдох, отпуская все напряжение... Обратите внимание на свои ступни. Почувствуйте, как они становятся тяжелыми и расслабленными... Позвольте этому ощущению расслабления подняться вверх по ногам... бедрам... животу... Позвольте всей нижней части вашего тела погрузиться в матрас... Теперь почувствуйте расслабление в ваших руках... плечах... Отпустите любое напряжение, которое вы здесь держите... Расслабьте шею... челюсть... лоб... Пусть все ваше тело станет тяжелым, удобным и расслабленным... Ничего не нужно делать... никуда не нужно идти... Просто отдыхайте... Если возникают мысли, позвольте им проплывать мимо, как облака в ночном небе... Вы в безопасности... вам комфортно... вы готовы ко сну... Спокойной ночи.`
    }
];

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const MeditationCard: React.FC<{ meditation: Meditation; onPlay: (meditation: Meditation) => void; }> = ({ meditation, onPlay }) => (
    <div className="group relative overflow-hidden rounded-2xl shadow-soft border border-gray-200/60 cursor-pointer transform transition-transform duration-300 hover:-translate-y-1.5" onClick={() => onPlay(meditation)}>
        <img src={meditation.imageUrl} alt={meditation.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
            <span className="text-xs font-bold uppercase bg-white/20 px-2 py-1 rounded-full">{meditation.category}</span>
            <h3 className="text-lg font-bold mt-1">{meditation.title}</h3>
            <p className="text-sm opacity-90">{meditation.duration}</p>
        </div>
    </div>
);

const AudioPlayerModal: React.FC<{
    meditation: Meditation | null;
    isPlaying: boolean;
    progress: number;
    isLoading: boolean;
    onClose: () => void;
    onTogglePlay: () => void;
    onSeek: (progress: number) => void;
}> = ({ meditation, isPlaying, progress, isLoading, onClose, onTogglePlay, onSeek }) => {
    const { t } = useTranslation();
    if (!meditation) return null;

    const formatTime = (percentage: number, durationSeconds: number) => {
        const time = percentage * durationSeconds;
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const durationInMinutes = parseInt(meditation.duration.split(' ')[0], 10);
    const totalSeconds = durationInMinutes * 60;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 glassmorphism-bg animate-fadeIn" onClick={onClose}>
            <div className="bg-surface rounded-2xl shadow-soft-lg w-full max-w-sm m-4 transform animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="relative p-6">
                    <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200" aria-label={t('common.close')}>
                        <XMarkIcon className="h-6 w-6 text-on-surface-variant" />
                    </button>
                    <img src={meditation.imageUrl} alt={meditation.title} className="w-full h-48 object-cover rounded-xl shadow-soft" />
                    <h3 className="text-xl font-bold text-on-surface mt-4">{meditation.title}</h3>
                    <p className="text-on-surface-variant text-sm">{meditation.summary}</p>

                    <div className="mt-6">
                        <input type="range" min="0" max="1" step="0.01" value={progress} onChange={(e) => onSeek(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-primary" />
                        <div className="flex justify-between text-xs font-medium text-on-surface-variant mt-1">
                            <span>{formatTime(progress, totalSeconds)}</span>
                            <span>{meditation.duration}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-center items-center">
                        <button onClick={onTogglePlay} disabled={isLoading} className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-soft-md transform hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? (
                                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                    {isPlaying ? <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h3a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75h-3zm7.5 0a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h3a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.748 1.295 2.536 0 3.284L7.279 20.99c-1.25.72-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />}
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const MindfulMomentsPage: React.FC = () => {
    const { t } = useTranslation();
    const meditations = getMeditations(t);
    const [selectedMeditation, setSelectedMeditation] = useState<Meditation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const progressIntervalRef = useRef<number | null>(null);
    const playbackStartTimeRef = useRef<number>(0);
    const pauseOffsetRef = useRef<number>(0);

    const cleanupAudio = useCallback(() => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (audioSourceRef.current) audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
        setIsPlaying(false);
        setProgress(0);
        pauseOffsetRef.current = 0;
    }, []);

    const startPlayback = useCallback(() => {
        if (!audioContextRef.current || !audioBufferRef.current) return;
        
        cleanupAudio();

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        
        const offset = pauseOffsetRef.current % audioBufferRef.current.duration;
        source.start(0, offset);

        playbackStartTimeRef.current = audioContextRef.current.currentTime - offset;
        audioSourceRef.current = source;
        setIsPlaying(true);

        source.onended = () => {
            if (progress >= 0.99) { 
                cleanupAudio();
                setSelectedMeditation(null);
            }
        };

        progressIntervalRef.current = window.setInterval(() => {
            if (audioContextRef.current && audioBufferRef.current) {
                const elapsed = audioContextRef.current.currentTime - playbackStartTimeRef.current;
                const newProgress = Math.min(elapsed / audioBufferRef.current.duration, 1);
                setProgress(newProgress);
            }
        }, 100);
    }, [cleanupAudio, progress]);

    const handlePlay = useCallback(async (meditation: Meditation) => {
        setSelectedMeditation(meditation);
        cleanupAudio();
        setIsLoading(true);
        setError(null);
        
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if(audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const base64Audio = await generateMeditationAudio(meditation.script);
            const decodedBytes = decode(base64Audio);
            audioBufferRef.current = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
            
            startPlayback();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setSelectedMeditation(null);
        } finally {
            setIsLoading(false);
        }
    }, [cleanupAudio, startPlayback]);
    
    const handleTogglePlay = useCallback(() => {
        if (!audioContextRef.current) return;

        if (isPlaying) {
            audioContextRef.current.suspend();
            if (audioSourceRef.current) {
                pauseOffsetRef.current = audioContextRef.current.currentTime - playbackStartTimeRef.current;
                audioSourceRef.current.stop();
                audioSourceRef.current.disconnect();
                audioSourceRef.current = null;
            }
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            setIsPlaying(false);
        } else {
            audioContextRef.current.resume().then(() => {
                startPlayback();
            });
        }
    }, [isPlaying, startPlayback]);
    
    const handleSeek = (newProgress: number) => {
        if (!audioBufferRef.current) return;
        pauseOffsetRef.current = newProgress * audioBufferRef.current.duration;
        setProgress(newProgress);
        if(isPlaying) {
            startPlayback();
        }
    };
    
    const handleCloseModal = () => {
        cleanupAudio();
        setSelectedMeditation(null);
    };
    
    useEffect(() => {
        return () => {
            cleanupAudio();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [cleanupAudio]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                        <MoonIcon className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-on-surface">{t('mindfulMoments.title')}</h1>
                        <p className="text-on-surface-variant">{t('mindfulMoments.subtitle')}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-700 font-medium">{t('mindfulMoments.errorPrefix')}{error}</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {meditations.map(med => (
                    <MeditationCard key={med.id} meditation={med} onPlay={handlePlay} />
                ))}
            </div>

            <AudioPlayerModal 
                meditation={selectedMeditation}
                isPlaying={isPlaying}
                progress={progress}
                isLoading={isLoading}
                onClose={handleCloseModal}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
            />
        </div>
    );
};

export default MindfulMomentsPage;
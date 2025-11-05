import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Biomarker, BiomarkerAlert, BloodTestRecord } from '../types';
import { apiService } from '../services/apiService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, ChevronDownIcon, BellIcon, SparklesIcon, XMarkIcon, MagnifyingGlassIcon, ClockIcon, LightBulbIcon, ClipboardDocumentListIcon, BoltIcon, CubeIcon, CalendarDaysIcon, DocumentTextIcon } from '../components/icons/IconComponents';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

const BiomarkerCardSkeleton: React.FC = () => (
    <div className="w-full">
        <Card className="border-l-4 border-gray-200 h-full flex flex-col">
            <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-2 space-y-2">
                <Skeleton className="h-8 w-1/2" />
            </div>
            <div className="mt-auto pt-3 flex justify-between items-baseline">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-24" />
            </div>
        </Card>
    </div>
);


const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
    switch (trend) {
        case 'up':
            return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
        case 'down':
            return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
        case 'stable':
            return <MinusIcon className="h-5 w-5 text-gray-500" />;
        default:
            return null;
    }
}

const HistoryLineChart: React.FC<{
    history: { value: number; date: string }[];
    unit: string;
    setTooltip: (tooltip: { visible: boolean; x: number; y: number; content: string } | null) => void;
}> = ({ history, unit, setTooltip }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!history || history.length < 2) {
        return <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">Недостаточно данных для графика.</div>;
    }

    const width = 300;
    const height = 120;
    const padding = { top: 10, right: 5, bottom: 20, left: 5 };

    const values = history.map(h => h.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    const yRange = maxValue - minValue;
    const yMin = yRange === 0 ? minValue - 1 : minValue - yRange * 0.2;
    const yMax = yRange === 0 ? maxValue + 1 : maxValue + yRange * 0.2;

    const getX = (index: number): number => {
       if (history.length === 1) return padding.left + (width - padding.left - padding.right) / 2;
       return padding.left + (index / (history.length - 1)) * (width - padding.left - padding.right);
    };
    
    const getY = (value: number): number => {
        if (yMax === yMin) return height - padding.bottom;
        return height - padding.bottom - ((value - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);
    };

    const pathData = history.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(2)},${getY(point.value).toFixed(2)}`).join(' ');

    const areaPathData = [
        pathData,
        `L ${getX(history.length - 1)},${height - padding.bottom}`,
        `L ${getX(0)},${height - padding.bottom}`,
        'Z',
    ].join(' ');

    const handleMouseMove = (e: React.MouseEvent, point: { value: number; date: string }, index: number) => {
        setHoveredIndex(index);
        setTooltip({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            content: `<div class="font-bold">${point.value} ${unit}</div><div class="text-xs">${new Date(point.date).toLocaleDateString()}</div>`
        });
    };
    
    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltip(null);
    };

    return (
        <div onMouseLeave={handleMouseLeave} className="relative h-40 cursor-crosshair group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" aria-label={`Line chart of biomarker history`}>
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                
                <path d={areaPathData} fill="url(#areaGradient)" className="pointer-events-none text-primary" />
                <path d={pathData} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                
                {history.map((point, i) => (
                     <circle key={`dot-${i}`} cx={getX(i)} cy={getY(point.value)} r="3" fill="currentColor" className="text-primary pointer-events-none" />
                ))}

                {hoveredIndex !== null && (
                     <circle cx={getX(hoveredIndex)} cy={getY(history[hoveredIndex].value)} r="5" fill="currentColor"
                        stroke="white" strokeWidth="2" className="text-primary pointer-events-none" />
                )}
                
                {history.map((point, i) => (
                    <rect key={i} x={getX(i)-10} y={0} width="20" height={height} fill="transparent"
                        onMouseMove={(e) => handleMouseMove(e, point, i)} />
                ))}
                
                <text x={getX(0)} y={height - 5} textAnchor="start" fontSize="10" fill="currentColor" className="text-on-surface-variant select-none">{new Date(history[0].date).toLocaleDateString()}</text>
                <text x={getX(history.length - 1)} y={height - 5} textAnchor="end" fontSize="10" fill="currentColor" className="text-on-surface-variant select-none">{new Date(history[history.length - 1].date).toLocaleDateString()}</text>
            </svg>
        </div>
    );
};

const TestResultModal: React.FC<{ testRecord: BloodTestRecord; onClose: () => void }> = ({ testRecord, onClose }) => {
    const { t } = useTranslation();
    const analysis = testRecord.analysis;
    const statusPillColors = {
        normal: 'bg-green-100 text-green-800',
        borderline: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
        low: 'bg-blue-100 text-blue-800',
    };

    return createPortal(
         <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true" onClick={onClose}>
          <div className="bg-surface rounded-2xl shadow-soft-lg w-full max-w-2xl m-4 transform animate-scaleIn" role="document" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface">{t('biomarkers.sourceTest')}</h3>
                    <p className="text-sm text-on-surface-variant">{t('biomarkers.sourceTestDate', { date: new Date(testRecord.date).toLocaleString() })}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label={t('common.close')}>
                    <XMarkIcon className="h-6 w-6 text-on-surface-variant" />
                </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                 <div>
                    <h4 className="font-semibold text-on-surface">{t('bloodTest.summary')}</h4>
                    <p className="mt-1 text-sm text-on-surface-variant bg-gray-50 p-3 rounded-lg">{analysis.summary}</p>
                 </div>
                 <div>
                    <h4 className="font-semibold text-on-surface">{t('biomarkers.biomarkersFromTest')}</h4>
                    <ul className="mt-2 space-y-2">
                        {analysis.biomarkers.map((marker, index) => (
                            <li key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-on-surface">{marker.name}</p>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${statusPillColors[marker.status]}`}>{marker.status}</span>
                                </div>
                                <p className="text-sm text-on-surface-variant">{marker.value} {marker.unit} <span className="text-xs">({t('biomarkers.detail.normalRange')} {marker.range})</span></p>
                                <p className="text-xs text-gray-500 mt-1">{marker.explanation}</p>
                            </li>
                        ))}
                    </ul>
                 </div>
                 <div>
                    <h4 className="font-semibold text-on-surface flex items-center"><LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />{t('bloodTest.recommendations')}</h4>
                     <ul className="mt-1 text-sm text-on-surface-variant list-disc list-inside bg-gray-50 p-3 rounded-lg">
                        {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                 </div>
            </div>
          </div>
        </div>,
        document.body
    )
}

const RecommendationSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode }> = ({ title, items, icon }) => (
    <div>
        <h5 className="font-semibold text-on-surface flex items-center">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">{icon}</span>
            {title}
        </h5>
        <ul className="mt-2 pl-6 space-y-1.5 text-on-surface-variant list-disc list-outside">
            {items.map((item, index) => <li key={index} className="pl-2">{item}</li>)}
        </ul>
    </div>
);


const BiomarkerDetailView: React.FC<{
    biomarker: Biomarker;
    setTooltip: (tooltip: { visible: boolean; x: number; y: number; content: string } | null) => void;
    alertConfig: BiomarkerAlert;
    onSaveAlert: (alert: BiomarkerAlert) => Promise<void>;
    isTriggered: boolean;
    onViewTest: (testId: string) => void;
}> = ({ biomarker, setTooltip, alertConfig, onSaveAlert, isTriggered, onViewTest }) => {
    const { t } = useTranslation();
    const [localAlert, setLocalAlert] = useState<BiomarkerAlert>(alertConfig);
    const [isSavingAlert, setIsSavingAlert] = useState(false);

    useEffect(() => {
        setLocalAlert(alertConfig);
    }, [alertConfig]);

    const handleAlertChange = (field: keyof BiomarkerAlert, value: any) => {
        setLocalAlert(prev => ({...prev, [field]: value}));
    };

    const handleAlertSave = async () => {
        setIsSavingAlert(true);
        try {
            await onSaveAlert(localAlert);
        } catch (error) {
            console.error("Failed to save alert:", error);
        } finally {
            setIsSavingAlert(false);
        }
    };

    const statusPillColors = {
        normal: 'bg-green-100 text-green-800',
        borderline: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
        low: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-on-surface-variant">{t('biomarkers.detail.currentValue')}</p>
                                <p className="mt-1 text-4xl font-bold text-on-surface">
                                    {biomarker.value} <span className="text-xl font-medium text-on-surface-variant">{biomarker.unit}</span>
                                </p>
                                <span className={`mt-2 inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusPillColors[biomarker.status]}`}>{biomarker.status}</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-on-surface">{t('biomarkers.detail.about')}</h4>
                                <p className="text-sm text-on-surface-variant mt-1">{biomarker.description}</p>
                                <p className="text-sm text-on-surface-variant mt-2"><span className="font-medium text-on-surface">{t('biomarkers.detail.normalRange')}</span> {biomarker.range}</p>
                            </div>
                        </div>
                    </Card>

                    {isTriggered && (
                       <Card className="bg-accent/10 border-accent-dark border-l-4">
                          <div className="flex items-center">
                              <div className="flex-shrink-0">
                                  <BellIcon className="h-6 w-6 text-accent-dark" />
                              </div>
                              <div className="ml-3">
                                  <p className="text-sm font-semibold text-accent-dark">
                                      {t('biomarkers.detail.alertTriggered', { value: biomarker.value, unit: biomarker.unit })}
                                  </p>
                              </div>
                          </div>
                       </Card>
                   )}

                    <Card>
                         <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-on-surface">{t('biomarkers.detail.alerts')}</h4>
                                <p className="text-sm text-on-surface-variant">{t('biomarkers.detail.alertsSubtitle')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" id="alert-enabled" className="sr-only peer" checked={localAlert.enabled} onChange={e => handleAlertChange('enabled', e.target.checked)} />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${localAlert.enabled ? 'max-h-96 mt-4' : 'max-h-0 mt-0'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="threshold-below" className="block text-sm font-medium text-on-surface-variant">{t('biomarkers.detail.alertIfBelow')}</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input type="number" id="threshold-below" value={localAlert.thresholdBelow ?? ''} onChange={e => handleAlertChange('thresholdBelow', e.target.value === '' ? undefined : parseFloat(e.target.value))} className="block w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 pr-16 text-on-surface" placeholder={`e.g., ${biomarker.range.split('-')[0].trim()}`} />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">{biomarker.unit}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="threshold-above" className="block text-sm font-medium text-on-surface-variant">{t('biomarkers.detail.alertIfAbove')}</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <input type="number" id="threshold-above" value={localAlert.thresholdAbove ?? ''} onChange={e => handleAlertChange('thresholdAbove', e.target.value === '' ? undefined : parseFloat(e.target.value))} className="block w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 pr-16 text-on-surface" placeholder={`e.g., ${biomarker.range.split('-')[1]?.trim() || '200'}`} />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">{biomarker.unit}</span></div>
                                    </div>
                                </div>
                            </div>
                            
                            {JSON.stringify(localAlert) !== JSON.stringify(alertConfig) && (
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleAlertSave} isLoading={isSavingAlert} className="px-4 py-2 text-sm">{t('common.saveChanges')}</Button>
                                </div>
                            )}
                        </div>
                    </Card>
                    
                    <Card>
                        <h4 className="font-semibold text-on-surface flex items-center"><ClockIcon className="h-5 w-5 mr-2 text-primary" /> {t('biomarkers.detail.history')}</h4>
                         <div className="mt-2 max-h-60 overflow-y-auto pr-2">
                            <table className="w-full text-sm text-left">
                                <thead className="sr-only">
                                    <tr><th>Date</th><th>Value</th><th>Source</th></tr>
                                </thead>
                                <tbody>
                                    {[...biomarker.history].reverse().map((entry, index) => (
                                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                                            <td className="py-2 pr-2 text-on-surface-variant">{new Date(entry.date).toLocaleDateString()}</td>
                                            <td className="py-2 pr-2 font-medium text-on-surface">{entry.value} {biomarker.unit}</td>
                                            <td className="py-2 text-right">
                                                 {entry.sourceTestId && (
                                                    <button onClick={() => onViewTest(entry.sourceTestId!)} className="p-1.5 rounded-full hover:bg-gray-100 text-on-surface-variant hover:text-primary" aria-label="View source test">
                                                        <MagnifyingGlassIcon className="h-4 w-4"/>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <h4 className="font-semibold text-on-surface">{t('biomarkers.detail.recentHistory')}</h4>
                        <div className="mt-2">
                           <HistoryLineChart history={biomarker.history} unit={biomarker.unit} setTooltip={setTooltip} />
                        </div>
                    </Card>
                    
                    {biomarker.recommendations && (
                        <Card>
                            <h4 className="text-lg font-bold text-on-surface flex items-center mb-4">
                                <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
                                {t('biomarkers.detail.aiActionPlan')}
                            </h4>
                            <div className="space-y-6 text-sm">
                                <RecommendationSection title={t('biomarkers.detail.nutrition')} items={biomarker.recommendations.nutrition} icon={<ClipboardDocumentListIcon className="h-5 w-5 text-primary" />} />
                                <RecommendationSection title={t('biomarkers.detail.lifestyle')} items={biomarker.recommendations.lifestyle} icon={<BoltIcon className="h-5 w-5 text-primary" />} />
                                <RecommendationSection title={t('biomarkers.detail.supplements')} items={biomarker.recommendations.supplements} icon={<CubeIcon className="h-5 w-5 text-primary" />} />
                                <div>
                                    <h5 className="font-semibold text-on-surface flex items-center">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                            <CalendarDaysIcon className="h-5 w-5 text-primary" />
                                        </span>
                                        {t('biomarkers.detail.nextAnalysis')}
                                    </h5>
                                    <p className="mt-2 pl-11 text-on-surface-variant">{biomarker.recommendations.next_checkup}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

function formatDistanceToNow(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'только что';
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} г. назад`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} мес. назад`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} д. назад`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ч. назад`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} мин. назад`;
    return `${Math.floor(seconds)} сек. назад`;
}

const BiomarkerCard: React.FC<{ biomarker: Biomarker, hasActiveAlert: boolean, isTriggered: boolean }> = ({ biomarker, hasActiveAlert, isTriggered }) => {
    const statusColors = {
        normal: 'border-green-400',
        borderline: 'border-yellow-400',
        high: 'border-red-400',
        low: 'border-blue-400',
    };
    const statusPillColors = {
        normal: 'bg-green-100 text-green-800',
        borderline: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
        low: 'bg-blue-100 text-blue-800',
    };
    const triggeredClasses = isTriggered ? 'border-accent-dark animate-pulse' : statusColors[biomarker.status];

    return (
         <Link to={`/biomarkers/${encodeURIComponent(biomarker.name)}`} className="w-full text-left h-full block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1" aria-label={`View details for ${biomarker.name}`}>
            <Card className={`border-l-4 ${triggeredClasses} h-full flex flex-col`}>
                <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-on-surface-variant pr-2">{biomarker.name}</p>
                    <div className="flex items-center space-x-2">
                      {hasActiveAlert && <BellIcon className={`h-5 w-5 ${isTriggered ? 'text-accent-dark' : 'text-gray-400'}`} />}
                      <TrendIcon trend={biomarker.trend} />
                    </div>
                </div>
                <p className="mt-1 text-3xl font-bold text-on-surface">
                    {biomarker.value} <span className="text-lg font-medium text-on-surface-variant">{biomarker.unit}</span>
                </p>
                <div className="mt-auto pt-2 flex justify-between items-baseline">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusPillColors[biomarker.status]}`}>{biomarker.status}</span>
                    <p className="text-xs text-on-surface-variant">Обновлено {formatDistanceToNow(biomarker.lastUpdated)}</p>
                </div>
            </Card>
        </Link>
    );
};

const BiomarkersPage: React.FC = () => {
  const { t } = useTranslation();
  const { biomarkerName } = useParams<{ biomarkerName?: string }>();
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; content: string } | null>(null);
  const [sortOption, setSortOption] = useState<string>('status');
  const [searchQuery, setSearchQuery] = useState('');
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [alerts, setAlerts] = useState<BiomarkerAlert[]>([]);
  const [testHistory, setTestHistory] = useState<BloodTestRecord[]>([]);
  const [viewingTestId, setViewingTestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  
  const sortOptions: { [key: string]: string } = {
    'status': 'По статусу',
    'name-asc': 'По имени (А-Я)',
    'name-desc': 'По имени (Я-А)',
    'updated-newest': 'По дате (сначала новые)',
    'updated-oldest': 'По дате (сначала старые)',
  };

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [biomarkersData, alertsData, testHistoryData] = await Promise.all([
                apiService.getBiomarkers(),
                apiService.getAlerts(),
                apiService.getTestHistory()
            ]);

            setBiomarkers(biomarkersData);
            setAlerts(alertsData);
            setTestHistory(testHistoryData);
        } catch (error) {
            console.error("Error loading biomarker page data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadData();
  }, [location.key]);

  const handleSaveAlert = async (updatedAlert: BiomarkerAlert) => {
      const newAlerts = alerts.map(a => a.biomarkerName === updatedAlert.biomarkerName ? updatedAlert : a);
      if (!alerts.find(a => a.biomarkerName === updatedAlert.biomarkerName)) {
        newAlerts.push(updatedAlert);
      }
      await apiService.saveAlerts(newAlerts);
      setAlerts(newAlerts);
  };

  const statusOrder: { [key in Biomarker['status']]: number } = {
      high: 0,
      low: 1,
      borderline: 2,
      normal: 3,
  };

  const filteredAndSortedBiomarkers = useMemo(() => {
    const sortable = [...biomarkers].filter(biomarker =>
      biomarker.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    sortable.sort((a, b) => {
        switch (sortOption) {
            case 'name-asc':
                return a.name.localeCompare(b.name, 'ru');
            case 'name-desc':
                return b.name.localeCompare(a.name, 'ru');
            case 'updated-newest':
                return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
            case 'updated-oldest':
                return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
            case 'status':
            default:
                return statusOrder[a.status] - statusOrder[b.status];
        }
    });
    return sortable;
  }, [sortOption, biomarkers, searchQuery]);

  const getAlertConfig = (biomarkerName: string): BiomarkerAlert => {
    return alerts.find(a => a.biomarkerName === biomarkerName) || { biomarkerName, enabled: false };
  };

  const isAlertTriggered = (biomarker: Biomarker, alert: BiomarkerAlert): boolean => {
      if (!alert.enabled) return false;
      const val = parseFloat(biomarker.value);
      if (isNaN(val)) return false;

      const belowTrigger = alert.thresholdBelow !== undefined && val < alert.thresholdBelow;
      const aboveTrigger = alert.thresholdAbove !== undefined && val > alert.thresholdAbove;

      return belowTrigger || aboveTrigger;
  };

  const viewingTestRecord = useMemo(() => {
    if (!viewingTestId) return null;
    return testHistory.find(t => t.id === viewingTestId) || null;
  }, [viewingTestId, testHistory]);

  if (isLoading) {
    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('biomarkers.title')}</h1>
                <p className="text-on-surface-variant mt-1">{t('biomarkers.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, index) => <BiomarkerCardSkeleton key={index} />)}
            </div>
        </div>
    );
  }

  if (biomarkerName) {
    const decodedName = decodeURIComponent(biomarkerName);
    const selectedBiomarker = biomarkers.find(b => b.name.toLowerCase() === decodedName.toLowerCase());

    if (!selectedBiomarker) {
        return (
            <div className="text-center p-8 animate-fadeIn">
                <h2 className="text-2xl font-bold text-on-surface">{t('biomarkers.notFound')}</h2>
                <p className="mt-2 text-on-surface-variant">{t('biomarkers.notFoundHint', { name: decodedName })}</p>
                <Link to="/biomarkers" className="mt-4 inline-block">
                    <Button>{t('biomarkers.backToAll')}</Button>
                </Link>
            </div>
        );
    }
    
    const alertConfig = getAlertConfig(selectedBiomarker.name);
    const triggered = isAlertTriggered(selectedBiomarker, alertConfig);
    return (
        <>
            <BiomarkerDetailView 
                biomarker={selectedBiomarker}
                setTooltip={setTooltip}
                alertConfig={alertConfig}
                onSaveAlert={handleSaveAlert}
                isTriggered={triggered}
                onViewTest={setViewingTestId}
            />
            {viewingTestRecord && (
                <TestResultModal testRecord={viewingTestRecord} onClose={() => setViewingTestId(null)} />
            )}
             {tooltip && tooltip.visible && (
                <div 
                    className="fixed z-50 p-2 text-sm text-center text-white bg-gray-900/80 rounded-md shadow-lg pointer-events-none"
                    style={{ top: tooltip.y, left: tooltip.x, transform: 'translate(10px, -110%)' }}
                >
                    <div dangerouslySetInnerHTML={{ __html: tooltip.content }} />
                </div>
            )}
        </>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
        <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('biomarkers.title')}</h1>
            <p className="text-on-surface-variant mt-1">{t('biomarkers.subtitle')}</p>
        </div>
      
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full rounded-xl border-gray-300 pl-10 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 text-on-surface"
                    placeholder={t('biomarkers.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex-shrink-0">
                <button 
                    id="dropdownDefaultButton" 
                    data-dropdown-toggle="sortDropdown" 
                    className="text-on-surface w-full sm:w-auto bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-primary/50 font-semibold rounded-xl text-sm px-5 py-2.5 text-center inline-flex items-center border border-gray-300 shadow-sm" 
                    type="button"
                >
                    {t('biomarkers.sortBy', { option: sortOptions[sortOption] })}
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                </button>
                <div id="sortDropdown" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44">
                    <ul className="py-2 text-sm text-gray-700" aria-labelledby="dropdownDefaultButton">
                        {Object.entries(sortOptions).map(([key, value]) => (
                             <li key={key}>
                                <button 
                                    onClick={() => setSortOption(key)} 
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    {value}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
        
       {filteredAndSortedBiomarkers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedBiomarkers.map(marker => {
                const alertConfig = getAlertConfig(marker.name);
                const triggered = isAlertTriggered(marker, alertConfig);
                return (
                  <BiomarkerCard 
                    key={marker.name} 
                    biomarker={marker} 
                    hasActiveAlert={alertConfig.enabled}
                    isTriggered={triggered}
                  />
                );
            })}
          </div>
        ) : (
            searchQuery ? (
                <div className="text-center py-16 px-4 bg-surface rounded-2xl shadow-soft border border-gray-200/60">
                    <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-on-surface-variant opacity-50" />
                    <h2 className="mt-4 text-2xl font-bold text-on-surface">{t('biomarkers.noResults')}</h2>
                    <p className="mt-2 text-on-surface-variant max-w-md mx-auto">{t('biomarkers.noResultsQuery', { query: searchQuery })}</p>
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-surface rounded-2xl shadow-soft border border-gray-200/60">
                    <DocumentTextIcon className="mx-auto h-16 w-16 text-on-surface-variant opacity-50" />
                    <h2 className="mt-4 text-2xl font-bold text-on-surface">{t('biomarkers.noData')}</h2>
                    <p className="mt-2 text-on-surface-variant max-w-md mx-auto">{t('biomarkers.noDataHint')}</p>
                    <Link to="/blood-test" className="mt-6 inline-block">
                        <Button leftIcon={<SparklesIcon className="w-5 h-5 mr-2"/>}>{t('biomarkers.analyzeFirst')}</Button>
                    </Link>
                </div>
            )
        )}
      {viewingTestRecord && (
          <TestResultModal testRecord={viewingTestRecord} onClose={() => setViewingTestId(null)} />
      )}
    </div>
  );
};

export default BiomarkersPage;
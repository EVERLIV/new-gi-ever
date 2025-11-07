import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BloodTestAnalysis } from '../types';
import { analyzeBloodTest } from '../services/geminiService';
import { apiService } from '../services/apiService';
import Button from '../components/ui/Button';
import { DocumentArrowUpIcon, LightBulbIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon, TrashIcon, PlusCircleIcon, ChartBarIcon } from '../components/icons/IconComponents';

const FileUploader: React.FC<{ onFileSelect: (file: File) => void; selectedFile: File | null; disabled: boolean }> = ({ onFileSelect, selectedFile, disabled }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-6">
            <label htmlFor="file-upload" className={`relative cursor-pointer rounded-xl font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex flex-col justify-center items-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-light transition-colors bg-surface hover:bg-gray-50">
                    {selectedFile ? (
                        <div className="text-center p-4">
                            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                            <p className="mt-2 font-semibold text-on-surface">{selectedFile.name}</p>
                            <p className="text-sm text-on-surface-variant">{t('bloodTest.changeFile')}</p>
                        </div>
                    ) : (
                        <div className="text-center text-on-surface-variant">
                            <DocumentArrowUpIcon className="mx-auto h-12 w-12" />
                            <p className="mt-2 font-semibold">{t('bloodTest.uploadLabel')}</p>
                            <p className="text-sm">{t('bloodTest.uploadSublabel')}</p>
                        </div>
                    )}
                </div>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => e.target.files && onFileSelect(e.target.files[0])} accept="image/png, image/jpeg, application/pdf" disabled={disabled} />
            </label>
        </div>
    );
}

const BloodTestPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customBiomarkers, setCustomBiomarkers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BloodTestAnalysis | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file) {
      setError(null);
      setAnalysis(null);
      setIsSaved(false);
      setSelectedFile(file);
    }
  }, []);
  
  // Handle file passed from PWA share/file handling
  useEffect(() => {
    const sharedFile = location.state?.sharedFile;
    if (sharedFile instanceof File) {
      handleFileSelect(sharedFile);
      // Clear the state to prevent re-processing on navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleFileSelect]);

  const handleStartOver = () => {
    setAnalysis(null);
    setSelectedFile(null);
    setCustomBiomarkers('');
    setIsSaved(false);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });

  const handleAnalysis = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file to analyze.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setIsSaved(false);

    try {
      const base64Image = await fileToBase64(selectedFile);
      const result = await analyzeBloodTest(base64Image, selectedFile.type, customBiomarkers);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, customBiomarkers]);

  const handleAnalysisChange = (field: keyof BloodTestAnalysis, value: any) => {
    if (analysis) {
        setAnalysis({ ...analysis, [field]: value });
    }
  };

  const handleBiomarkerChange = (index: number, field: string, value: string) => {
    if (analysis) {
        const updatedBiomarkers = [...analysis.biomarkers];
        updatedBiomarkers[index] = { ...updatedBiomarkers[index], [field]: value };
        handleAnalysisChange('biomarkers', updatedBiomarkers);
    }
  };
  
  const handleAddBiomarker = () => {
      if (analysis) {
          const newBiomarker = { name: '', value: '', unit: '', range: '', explanation: '', status: 'normal' as const };
          handleAnalysisChange('biomarkers', [...analysis.biomarkers, newBiomarker]);
      }
  };

  const handleDeleteBiomarker = (index: number) => {
      if (analysis) {
          const updatedBiomarkers = analysis.biomarkers.filter((_, i) => i !== index);
          handleAnalysisChange('biomarkers', updatedBiomarkers);
      }
  };

  const handleSaveResults = async () => {
      if (!analysis) return;

      setIsSaving(true);
      setError(null);

      try {
          await apiService.saveTestResult(analysis);
          setIsSaved(true);
      } catch (e) {
          console.error("Failed to save biomarkers:", e);
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          setError(`Could not save results: ${errorMessage}`);
      } finally {
        setIsSaving(false);
      }
  };
  
  const statusOptions = [
      { value: 'normal', label: t('bloodTest.statusOptions.normal') },
      { value: 'borderline', label: t('bloodTest.statusOptions.borderline') },
      { value: 'high', label: t('bloodTest.statusOptions.high') },
      { value: 'low', label: t('bloodTest.statusOptions.low') },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {!analysis && (
        <div className="bg-surface p-8 rounded-2xl shadow-soft border border-gray-200/60">
          <h2 className="text-2xl font-bold text-on-surface">{t('bloodTest.title')}</h2>
          <p className="mt-2 text-on-surface-variant">
            {t('bloodTest.subtitle')}
          </p>
          <FileUploader onFileSelect={handleFileSelect} selectedFile={selectedFile} disabled={isLoading} />
          <div className="mt-6">
              <label htmlFor="custom-biomarkers" className="block text-sm font-medium text-on-surface-variant">{t('bloodTest.focusLabel')}</label>
              <textarea
                id="custom-biomarkers"
                rows={3}
                value={customBiomarkers}
                onChange={(e) => setCustomBiomarkers(e.target.value)}
                className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface"
                placeholder={t('bloodTest.focusPlaceholder')}
                disabled={isLoading}
              />
          </div>
          <div className="mt-6">
            <Button onClick={handleAnalysis} isLoading={isLoading} disabled={!selectedFile || isLoading} className="w-full py-3 text-base" leftIcon={<SparklesIcon className="h-5 w-5 mr-2"/>}>
              {isLoading ? t('bloodTest.analyzingButton') : t('bloodTest.analyzeButton')}
            </Button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700 font-medium">{t('bloodTest.errorPrefix')}{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="text-center p-8 bg-surface rounded-2xl shadow-soft">
            <div className="flex justify-center items-center mb-4">
                 <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <p className="text-lg font-semibold text-on-surface">{t('bloodTest.analyzingMessage')}</p>
            <p className="text-on-surface-variant mt-1">{t('bloodTest.analyzingSubMessage')}</p>
        </div>
      )}

      {analysis && (
        <div className="animate-fadeIn bg-surface p-8 rounded-2xl shadow-soft border border-gray-200/60">
            <h2 className="text-2xl font-bold text-on-surface flex items-center"><SparklesIcon className="h-6 w-6 mr-2 text-primary" />{t('bloodTest.resultsTitle')}</h2>
            <p className="mt-2 text-on-surface-variant">{t('bloodTest.resultsSubtitle')}</p>
            
            <div className="mt-6 space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold text-on-surface">{t('bloodTest.summary')}</h3>
                    <textarea value={analysis.summary} onChange={e => handleAnalysisChange('summary', e.target.value)} className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" rows={3}></textarea>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-on-surface">{t('bloodTest.keyBiomarkers')}</h3>
                    <div className="mt-2 space-y-4">
                        {analysis.biomarkers.map((marker, index) => (
                           <div key={index} className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.name')}</label>
                                        <input type="text" value={marker.name} onChange={e => handleBiomarkerChange(index, 'name', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.status')}</label>
                                        <select value={marker.status} onChange={e => handleBiomarkerChange(index, 'status', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface">
                                            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                                        <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.value')}</label>
                                        <input type="text" value={marker.value} onChange={e => handleBiomarkerChange(index, 'value', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.unit')}</label>
                                        <input type="text" value={marker.unit} onChange={e => handleBiomarkerChange(index, 'unit', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.range')}</label>
                                        <input type="text" value={marker.range} onChange={e => handleBiomarkerChange(index, 'range', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" />
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-xs font-medium text-gray-500">{t('bloodTest.form.explanation')}</label>
                                    <textarea value={marker.explanation} onChange={e => handleBiomarkerChange(index, 'explanation', e.target.value)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" rows={2}></textarea>
                                </div>
                                <div className="text-right">
                                    <button onClick={() => handleDeleteBiomarker(index)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100" aria-label="Delete biomarker">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                           </div>
                        ))}
                    </div>
                    <Button onClick={handleAddBiomarker} className="mt-4" variant="secondary" leftIcon={<PlusCircleIcon className="h-5 w-5 mr-2"/>}>
                        {t('bloodTest.addBiomarker')}
                    </Button>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-on-surface flex items-center"><LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />{t('bloodTest.recommendations')}</h3>
                    <textarea value={analysis.recommendations.join('\n')} onChange={e => handleAnalysisChange('recommendations', e.target.value.split('\n'))} className="mt-2 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2 text-on-surface" rows={4}></textarea>
                </div>

                <div className="p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-800">
                                {t('bloodTest.disclaimer')}
                            </p>
                        </div>
                    </div>
                </div>

                {isSaved ? (
                     <div className="mt-6 text-center p-6 rounded-lg bg-green-50 border border-green-200 animate-fadeIn">
                        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                        <h3 className="mt-4 text-xl font-bold text-green-800">{t('bloodTest.savedTitle')}</h3>
                        <p className="mt-1 text-green-700">{t('bloodTest.savedSubtitle')}</p>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/biomarkers">
                                <Button className="w-full sm:w-auto" leftIcon={<ChartBarIcon className="h-5 w-5 mr-2"/>}>
                                    {t('bloodTest.viewMyBiomarkers')}
                                </Button>
                            </Link>
                            <Button onClick={handleStartOver} variant="secondary" className="w-full sm:w-auto">
                                {t('bloodTest.analyzeAnother')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleStartOver} variant="secondary" className="w-full sm:w-auto" disabled={isSaving}>
                            {t('bloodTest.startOverButton')}
                        </Button>
                        <Button
                            onClick={handleSaveResults}
                            className="w-full sm:w-auto flex-1"
                            leftIcon={<CheckCircleIcon className="h-5 w-5 mr-2"/>}
                            isLoading={isSaving}
                            disabled={isSaving}
                        >
                            {isSaving ? t('bloodTest.savingButton') : t('bloodTest.saveButton')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default BloodTestPage;
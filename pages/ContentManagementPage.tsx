import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import type { Article, Meditation } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon } from '../components/icons/IconComponents';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

const FormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    item: Article | Meditation | null;
    type: 'article' | 'meditation';
}> = ({ isOpen, onClose, onSave, item, type }) => {
    const { t } = useTranslation();
    const isEditing = !!item;
    const [formData, setFormData] = useState(
        isEditing ? item : 
        type === 'article' ? {
            title: '', category: 'Питание', summary: '', imageUrl: '', author: '', authorAvatar: '', publishedDate: new Date().toISOString().split('T')[0], content: ''
        } : {
            title: '', category: 'Релакс', summary: '', imageUrl: '', duration: '', script: ''
        }
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isEditing) {
            setFormData(item);
        } else {
             setFormData(type === 'article' ? {
                title: '', category: 'Питание', summary: '', imageUrl: '', author: '', authorAvatar: '', publishedDate: new Date().toISOString().split('T')[0], content: ''
            } : {
                title: '', category: 'Релакс', summary: '', imageUrl: '', duration: '', script: ''
            });
        }
    }, [item, isEditing, type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    const articleFields = [
        { name: 'title', label: t('contentManagement.form.title'), type: 'text' },
        { name: 'category', label: t('contentManagement.form.category'), type: 'select', options: [t('contentManagement.form.categoryOptions.nutrition'), t('contentManagement.form.categoryOptions.fitness'), t('contentManagement.form.categoryOptions.mentalHealth'), t('contentManagement.form.categoryOptions.longevity')] },
        { name: 'summary', label: t('contentManagement.form.summary'), type: 'textarea' },
        { name: 'imageUrl', label: t('contentManagement.form.imageUrl'), type: 'text' },
        { name: 'author', label: t('contentManagement.form.author'), type: 'text' },
        { name: 'authorAvatar', label: t('contentManagement.form.authorAvatarUrl'), type: 'text' },
        { name: 'publishedDate', label: t('contentManagement.form.publishedDate'), type: 'date' },
        { name: 'content', label: t('contentManagement.form.content'), type: 'textarea', rows: 8 },
    ];

    const meditationFields = [
        { name: 'title', label: t('contentManagement.form.title'), type: 'text' },
        { name: 'category', label: t('contentManagement.form.category'), type: 'select', options: [t('contentManagement.form.categoryOptions.focus'), t('contentManagement.form.categoryOptions.relax'), t('contentManagement.form.categoryOptions.sleep'), t('contentManagement.form.categoryOptions.morning')] },
        { name: 'summary', label: t('contentManagement.form.summary'), type: 'textarea' },
        { name: 'imageUrl', label: t('contentManagement.form.imageUrl'), type: 'text' },
        { name: 'duration', label: t('contentManagement.form.duration'), type: 'text' },
        { name: 'script', label: t('contentManagement.form.script'), type: 'textarea', rows: 8 },
    ];

    const fields = type === 'article' ? articleFields : meditationFields;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <form onSubmit={handleSave} className="w-full max-w-2xl bg-surface rounded-2xl shadow-soft-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {isEditing ? (type === 'article' ? t('contentManagement.editArticle') : t('contentManagement.editMeditation')) : (type === 'article' ? t('contentManagement.addArticle') : t('contentManagement.addMeditation'))}
                    </h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4">
                    {fields.map(field => (
                        <div key={field.name}>
                            <label htmlFor={field.name} className="block text-sm font-medium text-on-surface-variant">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea id={field.name} name={field.name} value={(formData as any)[field.name]} onChange={handleChange} required rows={field.rows || 3} className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-on-surface" />
                            ) : field.type === 'select' ? (
                                <select id={field.name} name={field.name} value={(formData as any)[field.name]} onChange={handleChange} required className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-on-surface">
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input id={field.name} name={field.name} type={field.type} value={(formData as any)[field.name]} onChange={handleChange} required className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-on-surface" />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end items-center p-4 border-t bg-gray-50/50 rounded-b-2xl">
                    <Button type="button" onClick={onClose} variant="secondary" className="mr-3" disabled={isSaving}>{t('common.cancel')}</Button>
                    <Button type="submit" isLoading={isSaving}>{t('common.save')}</Button>
                </div>
            </form>
        </div>,
        document.body
    );
};

const ContentManagementPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'articles' | 'meditations'>('articles');
    const [articles, setArticles] = useState<Article[]>([]);
    const [meditations, setMeditations] = useState<Meditation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Article | Meditation | null>(null);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [articlesData, meditationsData] = await Promise.all([
                apiService.getArticles(),
                apiService.getMeditations()
            ]);
            setArticles(articlesData);
            setMeditations(meditationsData);
        } catch (error) {
            console.error("Failed to fetch content:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddItem = () => {
        setCurrentItem(null);
        setIsModalOpen(true);
    };

    const handleEditItem = (item: Article | Meditation) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteItem = async (id: string, title: string) => {
        if (window.confirm(t('contentManagement.confirmDeleteMessage', { title }))) {
            try {
                if (activeTab === 'articles') {
                    await apiService.deleteArticle(id);
                } else {
                    await apiService.deleteMeditation(id);
                }
                fetchData(); // Refresh data
            } catch (error) {
                console.error("Failed to delete item:", error);
            }
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (activeTab === 'articles') {
                if (currentItem) {
                    await apiService.updateArticle(currentItem.id, data);
                } else {
                    await apiService.addArticle(data);
                }
            } else { // Meditations
                if (currentItem) {
                    await apiService.updateMeditation(currentItem.id, data);
                } else {
                    await apiService.addMeditation(data);
                }
            }
            fetchData();
        } catch (error) {
            console.error("Failed to save item:", error);
        }
    };
    
    const renderContentList = () => {
        if (isLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="flex justify-between items-center">
                    <div className="w-full">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </Card>
            ));
        }

        const items = activeTab === 'articles' ? articles : meditations;

        if (items.length === 0) {
            return <p className="text-center text-on-surface-variant mt-8">{activeTab === 'articles' ? t('contentManagement.noArticles') : t('contentManagement.noMeditations')}</p>;
        }

        return items.map(item => (
            <Card key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-on-surface">{item.title}</h3>
                    <p className="text-sm text-on-surface-variant">{item.category} &middot; {activeTab === 'articles' ? new Date((item as Article).publishedDate).toLocaleDateString() : (item as Meditation).duration}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button onClick={() => handleEditItem(item)} variant="secondary" className="p-2 h-9 w-9" aria-label={t('common.edit')}>
                        <PencilIcon className="h-5 w-5" />
                    </Button>
                     <Button onClick={() => handleDeleteItem(item.id, item.title)} variant="danger" className="p-2 h-9 w-9" aria-label={t('common.delete')}>
                        <TrashIcon className="h-5 w-5" />
                    </Button>
                </div>
            </Card>
        ));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('contentManagement.title')}</h1>
                <p className="text-on-surface-variant mt-1">{t('contentManagement.subtitle')}</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('articles')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'articles' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-gray-300'}`}
                    >
                        {t('contentManagement.articlesTab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('meditations')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm ${activeTab === 'meditations' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-gray-300'}`}
                    >
                        {t('contentManagement.meditationsTab')}
                    </button>
                </nav>
            </div>

            <div>
                <div className="flex justify-end mb-4">
                    <Button onClick={handleAddItem} leftIcon={<PlusCircleIcon className="h-5 w-5 mr-2" />}>
                        {activeTab === 'articles' ? t('contentManagement.addArticle') : t('contentManagement.addMeditation')}
                    </Button>
                </div>

                <div className="space-y-4">
                    {renderContentList()}
                </div>
            </div>
            
            <FormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={currentItem}
                // FIX: Map plural 'articles'/'meditations' to singular 'article'/'meditation' for the component prop.
                type={activeTab === 'articles' ? 'article' : 'meditation'}
            />
        </div>
    );
};

export default ContentManagementPage;
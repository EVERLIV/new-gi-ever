import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService, FirestorePermissionError } from '../services/apiService';
import { HeartIcon, ArrowUpTrayIcon } from '../components/icons/IconComponents';
import { HeartIconSolid } from '../components/icons/IconComponents';
import type { Article } from '../types';
import FirestoreWarning from '../components/ui/FirestoreWarning';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 rounded-md animate-pulse ${className}`} />
);

const ArticleCardSkeleton: React.FC = () => (
    <div className="space-y-3">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <div className="px-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    </div>
);

const ArticleDetailViewSkeleton: React.FC = () => (
    <div className="max-w-4xl mx-auto animate-fadeIn">
        <div className="overflow-hidden">
            <Skeleton className="h-5 w-1/4 mb-2" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="my-6 border-y border-gray-200 py-4">
                <Skeleton className="h-12 w-1/2" />
            </div>
        </div>
        <Skeleton className="w-full h-64 md:h-96 rounded-2xl" />
        <div className="p-1 mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <br />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
        </div>
    </div>
);

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
    // Basic color mapping for dynamic categories
    const categoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'питание': return 'text-card-blue-text';
            case 'фитнес': return 'text-card-red-text';
            case 'ментальное здоровье': return 'text-card-teal-text';
            case 'долголетие': return 'text-card-purple-text';
            default: return 'text-on-surface-variant';
        }
    };

    return (
        <Link to={`/articles/${encodeURIComponent(article.title)}`} className="group block space-y-3 transition-opacity hover:opacity-80">
            <div className="overflow-hidden rounded-2xl shadow-soft border border-gray-200/60">
                <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="px-1">
                <p className={`text-sm font-semibold ${categoryColor(article.category)}`}>{article.category}</p>
                <h3 className="text-lg font-bold text-on-surface mt-1">{article.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{article.summary}</p>
            </div>
        </Link>
    );
};

const ArticleDetailView: React.FC<{ article: Article }> = ({ article }) => {
    const { t } = useTranslation();
    const [isLiked, setIsLiked] = useState(false);
    const [likedArticles, setLikedArticles] = useState<string[]>([]);
    const [showCopyMessage, setShowCopyMessage] = useState(false);

    useEffect(() => {
        const fetchLikes = async () => {
            try {
                const likes = await apiService.getArticleLikes();
                setLikedArticles(likes);
                setIsLiked(likes.includes(article.title));
            } catch (e) {
                console.error("Failed to fetch liked articles", e);
                setIsLiked(false);
            }
        };
        fetchLikes();
    }, [article.title]);

    const handleToggleLike = async () => {
        try {
            const newLikedState = !isLiked;
            const newLikedArticles = newLikedState
                ? [...likedArticles, article.title]
                : likedArticles.filter((t: string) => t !== article.title);
            
            await apiService.saveArticleLikes(newLikedArticles);
            setLikedArticles(newLikedArticles);
            setIsLiked(newLikedState);
        } catch (e) {
            console.error("Failed to update liked articles", e);
        }
    };

    const handleShare = async () => {
        const cleanPathname = window.location.pathname.replace(/index\.html$/, '');
        const shareUrl = `${window.location.origin}${cleanPathname}${window.location.hash}`;

        const shareData = {
            title: article.title,
            text: article.summary,
            url: shareUrl,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Error sharing:", err);
            }
        } else {
            navigator.clipboard.writeText(shareUrl);
            setShowCopyMessage(true);
            setTimeout(() => setShowCopyMessage(false), 2000);
        }
    };
    
    const publishedDate = new Date(article.publishedDate).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const categoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'питание': return 'text-card-blue-text';
            case 'фитнес': return 'text-card-red-text';
            case 'ментальное здоровье': return 'text-card-teal-text';
            case 'долголетие': return 'text-card-purple-text';
            default: return 'text-on-surface-variant';
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="overflow-hidden">
                <p className={`text-sm font-bold ${categoryColor(article.category)} mb-2`}>{article.category}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">{article.title}</h1>

                <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-y border-gray-200 py-4">
                    <div className="flex items-center">
                        <img src={article.authorAvatar} alt={article.author} className="w-12 h-12 rounded-full mr-4 object-cover" />
                        <div>
                            <p className="font-semibold text-on-surface">{article.author}</p>
                            <p className="text-sm text-on-surface-variant">{t('articles.publishedOn', { date: publishedDate })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <button onClick={handleToggleLike} className="p-2 rounded-full hover:bg-red-100 group transition-colors" aria-label={isLiked ? t('articles.unlike') : t('articles.like')}>
                            {isLiked ? <HeartIconSolid className="h-6 w-6 text-red-500" /> : <HeartIcon className="h-6 w-6 text-on-surface-variant group-hover:text-red-500" />}
                        </button>
                        <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 text-on-surface-variant hover:text-on-surface transition-colors" aria-label={t('articles.share')}>
                            <ArrowUpTrayIcon className="h-6 w-6" />
                        </button>
                        {showCopyMessage && <span className="absolute left-full ml-2 text-sm text-primary animate-fadeIn whitespace-nowrap bg-primary/10 px-2 py-1 rounded-md">{t('articles.linkCopied')}</span>}
                    </div>
                </div>
            </div>
            <img src={article.imageUrl} alt={article.title} className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-soft-md" />
            <div className="p-1 mt-6">
                <div className="prose prose-lg max-w-none text-on-surface-variant prose-h4:text-on-surface" dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>
        </div>
    );
};

const ArticlesPage: React.FC = () => {
  const { articleTitle } = useParams<{ articleTitle?: string }>();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
        setIsLoading(true);
        setFirestoreError(false);
        try {
            const fetchedArticles = await apiService.getArticles();
            setArticles(fetchedArticles);
        } catch (error) {
            if (error instanceof FirestorePermissionError) {
                console.error("Firestore permission error:", error);
                setFirestoreError(true);
            } else {
                console.error("Failed to fetch articles:", error);
            }
        } finally {
            setIsLoading(false);
        }
    };
    fetchArticles();
  }, []);

  if (isLoading) {
    if (articleTitle) {
        return <ArticleDetailViewSkeleton />;
    }
    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('articles.title')}</h1>
                <p className="text-on-surface-variant mt-1">{t('articles.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
                {Array.from({ length: 4 }).map((_, index) => (
                    <ArticleCardSkeleton key={index} />
                ))}
            </div>
        </div>
    );
  }

  if (articleTitle) {
      const decodedTitle = decodeURIComponent(articleTitle);
      const article = articles.find(a => a.title === decodedTitle);

      if (article) {
          return <ArticleDetailView article={article} />;
      } else {
          return (
              <div className="text-center p-8">
                  <h2 className="text-2xl font-bold">{t('articles.notFound')}</h2>
                  <Link to="/articles" className="text-primary hover:underline mt-4 inline-block">{t('articles.backToAll')}</Link>
              </div>
          );
      }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('articles.title')}</h1>
        <p className="text-on-surface-variant mt-1">{t('articles.subtitle')}</p>
      </div>
      
      {firestoreError && articles.length === 0 ? (
        <FirestoreWarning />
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
            {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
            ))}
        </div>
      )}

    </div>
  );
};

export default ArticlesPage;
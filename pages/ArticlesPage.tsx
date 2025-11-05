
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { HeartIcon, ArrowUpTrayIcon } from '../components/icons/IconComponents';
import { HeartIconSolid } from '../components/icons/IconComponents';

const articles = [
  {
    category: 'Nutrition',
    title: 'The Benefits of a Mediterranean Diet',
    summary: 'Discover why the Mediterranean diet is consistently ranked as one of the healthiest eating patterns for heart health and longevity.',
    imageUrl: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-blue-text' },
    author: 'Dr. Emily Carter',
    authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    publishedDate: '2024-05-15',
    content: `
      <p class="mb-4">The Mediterranean diet is a way of eating based on the traditional cuisines of Greece, Italy, and other countries that border the Mediterranean Sea. Plant-based foods, such as whole grains, vegetables, legumes, fruits, nuts, seeds, herbs, and spices, are the foundation of the diet. Olive oil is the main source of added fat.</p>
      <p class="mb-4">Fish, seafood, dairy, and poultry are included in moderation. Red meat and sweets are eaten only occasionally. This dietary pattern has been associated with a wide range of health benefits, including a lower risk of heart disease, certain cancers, and cognitive decline.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Key Benefits:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Heart Health:</strong> Rich in monounsaturated fats from olive oil and omega-3s from fish, it helps lower "bad" LDL cholesterol and reduce inflammation.</li>
        <li><strong>Brain Function:</strong> The antioxidants and healthy fats in the diet are protective against age-related cognitive decline and may reduce the risk of Alzheimer's disease.</li>
        <li><strong>Weight Management:</strong> Being high in fiber and healthy fats, it promotes satiety, which can help with maintaining a healthy weight without feeling deprived.</li>
      </ul>
      <p>To get started, try simple swaps like using olive oil instead of butter, eating fish twice a week, and filling your plate with a variety of colorful vegetables.</p>
    `
  },
  {
    category: 'Fitness',
    title: 'High-Intensity Interval Training (HIIT) Explained',
    summary: 'Learn how short bursts of intense exercise followed by brief recovery periods can significantly boost your cardiovascular fitness.',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-red-text' },
    author: 'Mark Johnson',
    authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    publishedDate: '2024-05-10',
    content: `
      <p class="mb-4">High-Intensity Interval Training (HIIT) involves short, intense bursts of exercise alternated with low-intensity recovery periods. It is one of the most time-efficient ways to exercise, with workouts typically lasting between 10 to 30 minutes.</p>
      <p class="mb-4">The core idea is to push your body to its limit for a brief period, then allow it to recover before the next burst. This method keeps your heart rate up and can burn more fat in less time compared to steady-state cardio. A typical HIIT session might involve 30 seconds of sprinting followed by 60 seconds of walking, repeated for 15 minutes.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Why HIIT Works:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Time-Efficiency:</strong> Get the benefits of a longer workout in a fraction of the time.</li>
        <li><strong>Metabolic Boost:</strong> HIIT can increase your metabolic rate for hours after exercise, a phenomenon known as the afterburn effect.</li>
        <li><strong>Improved VO2 Max:</strong> It's highly effective at improving your VO2 max, a key indicator of cardiovascular health.</li>
      </ul>
      <p>Because of its intensity, it's important to start slowly and ensure you have a solid fitness base before diving into advanced HIIT routines. Always warm up properly and cool down afterward.</p>
    `
  },
  {
    category: 'Mental Wellness',
    title: 'Mindfulness and Meditation for Stress Reduction',
    summary: 'Explore simple techniques to practice mindfulness and meditation, which can help calm your mind and reduce daily stress.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-4e05860f5d58?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-teal-text' },
    author: 'Aisha Khan',
    authorAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    publishedDate: '2024-04-28',
    content: `
      <p class="mb-4">Mindfulness is the practice of purposely bringing one's attention to the present moment without evaluation, a skill you can develop through meditation or other training. Meditation is a practice where an individual uses a technique – such as mindfulness, or focusing the mind on a particular object, thought, or activity – to train attention and awareness, and achieve a mentally clear and emotionally calm and stable state.</p>
      <p class="mb-4">In a world filled with distractions, these practices can be a powerful tool to manage stress, anxiety, and the general overwhelm of daily life. Even a few minutes a day can make a significant difference in your overall well-being.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Simple Mindfulness Exercises:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Mindful Breathing:</strong> Sit comfortably and focus on your breath. Notice the sensation of the air entering your nostrils and filling your lungs. When your mind wanders, gently guide it back to your breath.</li>
        <li><strong>Body Scan:</strong> Lie down and bring your attention to different parts of your body, from your toes to your head. Notice any sensations (warmth, tingling, tension) without judging them.</li>
        <li><strong>Mindful Walking:</strong> Pay attention to the sensation of your feet on the ground and the movement of your body as you walk.</li>
      </ul>
      <p>The goal isn't to stop your thoughts, but rather to become an observer of them without getting carried away.</p>
    `
  },
  {
    category: 'Longevity',
    title: 'The Science of Sleep: Why It Matters for a Long Life',
    summary: 'Understand the critical role that quality sleep plays in cellular repair, cognitive function, and overall long-term health.',
    imageUrl: 'https://images.unsplash.com/photo-1444210971048-6a3006adbe44?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-purple-text' },
    author: 'Dr. David Chen',
    authorAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    publishedDate: '2024-04-19',
    content: `
      <p class="mb-4">Sleep is not merely a period of inactivity; it is a critical biological process essential for our physical and mental health. While we rest, our bodies are hard at work repairing cells, consolidating memories, and regulating essential hormones. Chronic sleep deprivation is linked to a host of health problems, including heart disease, diabetes, obesity, and a weakened immune system.</p>
      <p class="mb-4">During sleep, our brains cycle through different stages, including REM (Rapid Eye Movement) and non-REM sleep. Each stage plays a unique role, from deep physical rest and repair in non-REM sleep to emotional regulation and memory processing in REM sleep. Getting a full night of quality sleep allows us to complete these cycles, which is vital for feeling refreshed and functioning optimally the next day.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Tips for Better Sleep:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Consistent Schedule:</strong> Go to bed and wake up at the same time every day, even on weekends.</li>
        <li><strong>Create a Restful Environment:</strong> Keep your bedroom dark, quiet, cool, and free of screens.</li>
        <li><strong>Limit Caffeine and Alcohol:</strong> Avoid stimulants like caffeine and alcohol, especially in the hours before bedtime.</li>
        <li><strong>Wind Down:</strong> Develop a relaxing pre-sleep routine, such as reading a book, taking a warm bath, or listening to calming music.</li>
      </ul>
      <p>Prioritizing sleep is one of the most effective things you can do to support your long-term health and well-being.</p>
    `
  },
];

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

const ArticleCard: React.FC<{ article: typeof articles[0] }> = ({ article }) => {
  return (
    <Link to={`/articles/${encodeURIComponent(article.title)}`} className="group block space-y-3 transition-opacity hover:opacity-80">
        <div className="overflow-hidden rounded-2xl shadow-soft border border-gray-200/60">
            <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="px-1">
            <p className={`text-sm font-semibold ${article.color.text}`}>{article.category}</p>
            <h3 className="text-lg font-bold text-on-surface mt-1">{article.title}</h3>
            <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{article.summary}</p>
        </div>
    </Link>
  );
};

const ArticleDetailView: React.FC<{ article: typeof articles[0] }> = ({ article }) => {
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

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="overflow-hidden">
                <p className={`text-sm font-bold ${article.color.text} mb-2`}>{article.category}</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">{article.title}</h1>

                <div className="my-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-y border-gray-200 py-4">
                    <div className="flex items-center">
                        <img src={article.authorAvatar} alt={article.author} className="w-12 h-12 rounded-full mr-4 object-cover" />
                        <div>
                            <p className="font-semibold text-on-surface">{article.author}</p>
                            <p className="text-sm text-on-surface-variant">Published on {new Date(article.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                        <button onClick={handleToggleLike} className="p-2 rounded-full hover:bg-red-100 group transition-colors" aria-label={isLiked ? 'Unlike article' : 'Like article'}>
                            {isLiked ? <HeartIconSolid className="h-6 w-6 text-red-500" /> : <HeartIcon className="h-6 w-6 text-on-surface-variant group-hover:text-red-500" />}
                        </button>
                        <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100 text-on-surface-variant hover:text-on-surface transition-colors" aria-label="Share article">
                            <ArrowUpTrayIcon className="h-6 w-6" />
                        </button>
                        {showCopyMessage && <span className="absolute left-full ml-2 text-sm text-primary animate-fadeIn whitespace-nowrap bg-primary/10 px-2 py-1 rounded-md">Link copied!</span>}
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching articles
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    if (articleTitle) {
        return <ArticleDetailViewSkeleton />;
    }
    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Health Articles</h1>
                <p className="text-on-surface-variant mt-1">Curated reads to inspire and inform your wellness journey.</p>
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
                  <h2 className="text-2xl font-bold">Article not found</h2>
                  <Link to="/articles" className="text-primary hover:underline mt-4 inline-block">Back to all articles</Link>
              </div>
          );
      }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Health Articles</h1>
        <p className="text-on-surface-variant mt-1">Curated reads to inspire and inform your wellness journey.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
};

export default ArticlesPage;

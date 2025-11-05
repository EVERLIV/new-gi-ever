import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import { HeartIcon, ArrowUpTrayIcon } from '../components/icons/IconComponents';
import { HeartIconSolid } from '../components/icons/IconComponents';

const articles = [
  {
    category: 'Питание',
    title: 'Польза средиземноморской диеты',
    summary: 'Узнайте, почему средиземноморская диета постоянно признается одним из самых здоровых стилей питания для здоровья сердца и долголетия.',
    imageUrl: 'https://images.unsplash.com/photo-1522184216316-3c25379f9760?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-blue-text' },
    author: 'Д-р Эмили Картер',
    authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    publishedDate: '2024-05-15',
    content: `
      <p class="mb-4">Средиземноморская диета — это система питания, основанная на традиционных кухнях Греции, Италии и других стран, граничащих со Средиземным морем. Основу рациона составляют растительные продукты, такие как цельные злаки, овощи, бобовые, фрукты, орехи, семена, травы и специи. Оливковое масло является основным источником добавленных жиров.</p>
      <p class="mb-4">Рыба, морепродукты, молочные продукты и птица включаются в умеренных количествах. Красное мясо и сладости употребляются лишь изредка. Этот тип питания связывают с широким спектром преимуществ для здоровья, включая снижение риска сердечных заболеваний, некоторых видов рака и когнитивных нарушений.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Ключевые преимущества:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Здоровье сердца:</strong> Богатая мононенасыщенными жирами из оливкового масла и омега-3 из рыбы, диета помогает снизить "плохой" холестерин ЛПНП и уменьшить воспаление.</li>
        <li><strong>Функция мозга:</strong> Антиоксиданты и полезные жиры в диете защищают от возрастного снижения когнитивных функций и могут снизить риск болезни Альцгеймера.</li>
        <li><strong>Контроль веса:</strong> Благодаря высокому содержанию клетчатки и полезных жиров, она способствует насыщению, что может помочь в поддержании здорового веса без чувства обделенности.</li>
      </ul>
      <p>Чтобы начать, попробуйте простые замены, такие как использование оливкового масла вместо сливочного, употребление рыбы дважды в неделю и наполнение тарелки разнообразными цветными овощами.</p>
    `
  },
  {
    category: 'Фитнес',
    title: 'Объяснение высокоинтенсивных интервальных тренировок (ВИИТ)',
    summary: 'Узнайте, как короткие всплески интенсивных упражнений, сменяющиеся краткими периодами восстановления, могут значительно улучшить вашу сердечно-сосудистую систему.',
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-red-text' },
    author: 'Марк Джонсон',
    authorAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    publishedDate: '2024-05-10',
    content: `
      <p class="mb-4">Высокоинтенсивные интервальные тренировки (ВИИТ) включают короткие, интенсивные всплески упражнений, чередующиеся с периодами восстановления низкой интенсивности. Это один из самых эффективных по времени способов тренировки, продолжительность которой обычно составляет от 10 до 30 минут.</p>
      <p class="mb-4">Основная идея заключается в том, чтобы довести свое тело до предела на короткий период, а затем дать ему восстановиться перед следующим всплеском. Этот метод поддерживает высокую частоту сердечных сокращений и может сжигать больше жира за меньшее время по сравнению с кардио в постоянном темпе. Типичная сессия ВИИТ может включать 30 секунд спринта, за которыми следует 60 секунд ходьбы, повторяемые в течение 15 минут.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Почему ВИИТ работает:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Эффективность по времени:</strong> Получите преимущества более длительной тренировки за меньшее время.</li>
        <li><strong>Ускорение метаболизма:</strong> ВИИТ может повысить ваш метаболизм на несколько часов после тренировки, явление, известное как эффект дожигания.</li>
        <li><strong>Улучшение VO2 max:</strong> Этот метод очень эффективен для улучшения вашего VO2 max, ключевого показателя здоровья сердечно-сосудистой системы.</li>
      </ul>
      <p>Из-за высокой интенсивности важно начинать медленно и убедиться, что у вас есть солидная физическая подготовка, прежде чем переходить к продвинутым программам ВИИТ. Всегда правильно разогревайтесь и остывайте после тренировки.</p>
    `
  },
  {
    category: 'Ментальное здоровье',
    title: 'Осознанность и медитация для снижения стресса',
    summary: 'Изучите простые техники практики осознанности и медитации, которые могут помочь успокоить ум и уменьшить ежедневный стресс.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-4e05860f5d58?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-teal-text' },
    author: 'Аиша Хан',
    authorAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    publishedDate: '2024-04-28',
    content: `
      <p class="mb-4">Осознанность — это практика целенаправленного привлечения внимания к настоящему моменту без оценки, навык, который можно развить с помощью медитации или других тренировок. Медитация — это практика, в которой человек использует технику, такую как осознанность или сосредоточение ума на определенном объекте, мысли или деятельности, чтобы тренировать внимание и осознание, а также достичь умственно ясного и эмоционально спокойного и стабильного состояния.</p>
      <p class="mb-4">В мире, полном отвлекающих факторов, эти практики могут быть мощным инструментом для управления стрессом, тревогой и общим перегрузом повседневной жизни. Даже несколько минут в день могут значительно улучшить ваше общее самочувствие.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Простые упражнения на осознанность:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Осознанное дыхание:</strong> Сядьте удобно и сосредоточьтесь на своем дыхании. Замечайте ощущение воздуха, входящего в ноздри и наполняющего легкие. Когда ваш ум отвлекается, мягко верните его к дыханию.</li>
        <li><strong>Сканирование тела:</strong> Лягте и обратите внимание на разные части вашего тела, от пальцев ног до головы. Замечайте любые ощущения (тепло, покалывание, напряжение) без осуждения.</li>
        <li><strong>Осознанная ходьба:</strong> Обращайте внимание на ощущение ваших стоп на земле и движение вашего тела во время ходьбы.</li>
      </ul>
      <p>Цель не в том, чтобы остановить свои мысли, а в том, чтобы стать их наблюдателем, не увлекаясь ими.</p>
    `
  },
  {
    category: 'Долголетие',
    title: 'Наука о сне: почему он важен для долгой жизни',
    summary: 'Поймите критическую роль качественного сна в восстановлении клеток, когнитивной функции и общем долгосрочном здоровье.',
    imageUrl: 'https://images.unsplash.com/photo-1444210971048-6a3006adbe44?q=80&w=2070&auto=format&fit=crop',
    color: { text: 'text-card-purple-text' },
    author: 'Д-р Дэвид Чен',
    authorAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
    publishedDate: '2024-04-19',
    content: `
      <p class="mb-4">Сон — это не просто период бездействия; это критически важный биологический процесс, необходимый для нашего физического и психического здоровья. Пока мы отдыхаем, наши тела усердно работают над восстановлением клеток, консолидацией воспоминаний и регуляцией основных гормонов. Хроническое недосыпание связано с множеством проблем со здоровьем, включая болезни сердца, диабет, ожирение и ослабленную иммунную систему.</p>
      <p class="mb-4">Во время сна наш мозг проходит через различные стадии, включая REM (быстрое движение глаз) и не-REM сон. Каждая стадия играет уникальную роль, от глубокого физического отдыха и восстановления в не-REM сне до эмоциональной регуляции и обработки памяти в REM сне. Полноценный качественный сон позволяет нам завершить эти циклы, что жизненно важно для ощущения бодрости и оптимального функционирования на следующий день.</p>
      <h4 class="text-lg font-bold mt-6 mb-2">Советы для лучшего сна:</h4>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>Постоянный график:</strong> Ложитесь спать и просыпайтесь в одно и то же время каждый день, даже в выходные.</li>
        <li><strong>Создайте спокойную обстановку:</strong> Ваша спальня должна быть темной, тихой, прохладной и свободной от экранов.</li>
        <li><strong>Ограничьте кофеин и алкоголь:</strong> Избегайте стимуляторов, таких как кофеин и алкоголь, особенно за несколько часов до сна.</li>
        <li><strong>Расслабьтесь перед сном:</strong> Разработайте расслабляющий ритуал перед сном, например, чтение книги, теплая ванна или прослушивание успокаивающей музыки.</li>
      </ul>
      <p>Приоритизация сна — одно из самых эффективных действий, которые вы можете предпринять для поддержания своего долгосрочного здоровья и благополучия.</p>
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
        {articles.map((article) => (
          <ArticleCard key={article.title} article={article} />
        ))}
      </div>
    </div>
  );
};

export default ArticlesPage;
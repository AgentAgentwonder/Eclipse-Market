import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Newspaper, ExternalLink, Filter, RefreshCw } from 'lucide-react';
import type { StockNews } from '../../types/stocks';

interface StockNewsFeedProps {
  symbol?: string;
}

type SentimentFilter = 'all' | 'bullish' | 'neutral' | 'bearish';
type ImpactFilter = 'all' | 'high' | 'medium' | 'low';

export function StockNewsFeed({ symbol }: StockNewsFeedProps) {
  const [news, setNews] = useState<StockNews[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentFilter>('all');
  const [impact, setImpact] = useState<ImpactFilter>('all');
  const [sourceSearch, setSourceSearch] = useState('');

  useEffect(() => {
    if (!symbol) {
      setNews([]);
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      try {
        const result = await invoke<StockNews[]>('get_stock_news', {
          symbol,
          limit: 20,
        });
        setNews(result);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbol]);

  const sources = useMemo(() => {
    const uniqueSources = new Set(news.map(item => item.source));
    return Array.from(uniqueSources).sort();
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      if (sentiment !== 'all' && item.sentiment !== sentiment) {
        return false;
      }
      if (impact !== 'all' && item.impactLevel !== impact) {
        return false;
      }
      if (sourceSearch && !item.source.toLowerCase().includes(sourceSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [news, sentiment, impact, sourceSearch]);

  if (!symbol) {
    return (
      <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 text-center text-gray-400">
        <Newspaper className="w-6 h-6 mx-auto mb-2 opacity-70" />
        <p>Select a stock to view tailored news coverage.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-purple-300" />
            {symbol} News Feed
          </h3>
          <p className="text-sm text-gray-400">
            AI summaries, sentiment analysis, and impact ratings for the latest headlines
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>
          <select
            value={sentiment}
            onChange={e => setSentiment(e.target.value as SentimentFilter)}
            className="bg-slate-800/60 text-sm rounded-lg px-3 py-2 border border-purple-500/20 focus:outline-none"
          >
            <option value="all">All Sentiment</option>
            <option value="bullish">Bullish</option>
            <option value="neutral">Neutral</option>
            <option value="bearish">Bearish</option>
          </select>
          <select
            value={impact}
            onChange={e => setImpact(e.target.value as ImpactFilter)}
            className="bg-slate-800/60 text-sm rounded-lg px-3 py-2 border border-purple-500/20 focus:outline-none"
          >
            <option value="all">All Impact</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>
          <input
            type="text"
            value={sourceSearch}
            onChange={e => setSourceSearch(e.target.value)}
            placeholder="Filter by source"
            className="bg-slate-800/60 text-sm rounded-lg px-3 py-2 border border-purple-500/20 focus:outline-none"
            list={`news-sources-${symbol}`}
          />
          <datalist id={`news-sources-${symbol}`}>
            {sources.map(source => (
              <option key={source} value={source} />
            ))}
          </datalist>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading latest headlines…</span>
        </div>
      )}

      <div className="space-y-4">
        {filteredNews.map(item => (
          <article
            key={item.id}
            className="bg-slate-800/50 border border-purple-500/10 rounded-xl p-4 hover:border-purple-500/30 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-100">
                  <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-purple-300 flex items-center gap-2">
                    {item.title}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </h4>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  <span>&bull;</span>
                  <span>{item.source}</span>
                  <span>&bull;</span>
                  <span className={`uppercase tracking-wide font-semibold ${
                    item.sentiment === 'bullish'
                      ? 'text-green-300'
                      : item.sentiment === 'bearish'
                      ? 'text-red-300'
                      : 'text-blue-300'
                  }`}>
                    {item.sentiment}
                  </span>
                  <span>&bull;</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      item.impactLevel === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : item.impactLevel === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {item.impactLevel} impact
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-300 leading-relaxed space-y-2">
              {item.aiSummary ? (
                <p className="text-purple-200 font-medium">AI Summary: {item.aiSummary}</p>
              ) : (
                <p>{item.summary}</p>
              )}
              {item.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-purple-200/80">
                  {item.topics.map(topic => (
                    <span key={topic} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}

        {filteredNews.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <p>No news matching the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

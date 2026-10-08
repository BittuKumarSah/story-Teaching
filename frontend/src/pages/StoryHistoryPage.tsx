import { useEffect, useState } from 'react';
import { useChildren } from '../contexts/ChildContext';
import { storiesApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Clock, TrendingUp, Target, Sparkles, 
  Filter, ChevronDown, ChevronRight, Search, X 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn, formatDate, getDifficultyColor, getUnderstandingColor } from '../utils/helpers';

export default function StoryHistoryPage() {
  const { selectedChild, children, setSelectedChild } = useChildren();
  const navigate = useNavigate();
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      fetchStories();
    }
  }, [selectedChild]);

  const fetchStories = async () => {
    if (!selectedChild) return;
    setIsLoading(true);
    try {
      const response = await storiesApi.list(selectedChild.id);
      setStories(response.data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'completed' && story.completed_at) ||
      (filter === 'in-progress' && !story.completed_at);
    return matchesSearch && matchesFilter;
  });

  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No child selected</h2>
        <p className="text-gray-600 mb-6">Please select a child to view their story history</p>
        <button onClick={() => navigate('/children')} className="btn-primary">
          Manage Children
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Story History</h1>
          <p className="text-gray-600">{selectedChild.name}'s learning journey</p>
        </div>
        <Link to="/generate" className="btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          New Story
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories..."
              className="input pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="btn-outline flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="mt-4 flex flex-wrap gap-2 animate-slide-up">
            {['all', 'completed', 'in-progress'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as 'all' | 'completed' | 'in-progress')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f === 'all' && 'All Stories'}
                {f === 'completed' && 'Completed'}
                {f === 'in-progress' && 'In Progress'}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading stories..." />
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || filter !== 'all' ? 'No matching stories' : 'No stories yet'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Start your first learning adventure!'}
          </p>
          <Link to="/generate" className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create a Story
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <Link
              key={story.id}
              to={story.completed_at ? `/results/${story.id}` : `/story/${story.id}`}
              className="card p-4 card-hover flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {story.title}
                  </h3>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getDifficultyColor(story.difficulty))}>
                    {story.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{story.topic}</p>
                <p className="text-xs text-gray-400 mt-1">Created {formatDate(story.created_at)}</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                {story.completed_at ? (
                  <>
                    <div className={cn('text-right', getUnderstandingColor(0))}>
                      <p className="font-semibold text-lg">Completed</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      In Progress
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
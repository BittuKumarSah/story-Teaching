import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesApi } from '../services/api';
import { BookOpen, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Target, Sparkles, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn } from '../utils/helpers';

export default function StoryReaderPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await storiesApi.get(parseInt(storyId!));
        setStory(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStory();
  }, [storyId]);

  const paragraphs = story?.content?.split('\n\n').filter((p: string) => p.trim()) || [];

  const handleStartAssessment = () => {
    navigate(`/assess/${storyId}`);
  };

  const handlePrevParagraph = () => {
    setCurrentParagraph(prev => Math.max(0, prev - 1));
  };

  const handleNextParagraph = () => {
    setCurrentParagraph(prev => Math.min(paragraphs.length - 1, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading story..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Unable to load story</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="mt-4 btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </button>
      </div>
    );
  }

  if (!story) return null;

  const currentContent = paragraphs[currentParagraph] || '';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium">{currentParagraph + 1}</span>
          <span>/</span>
          <span>{paragraphs.length}</span>
        </div>
        <button
          onClick={() => setShowObjectives(!showObjectives)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle learning objectives"
        >
          <Target className="w-5 h-5" />
        </button>
      </div>

      <article className="card overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary-600 font-medium">Learning Story</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">{story.title}</h1>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className={cn('px-3 py-1 rounded-full text-xs font-medium', 
              story.difficulty === 'beginner' && 'bg-green-100 text-green-700',
              story.difficulty === 'intermediate' && 'bg-blue-100 text-blue-700',
              story.difficulty === 'advanced' && 'bg-purple-100 text-purple-700'
            )}>
              {story.difficulty}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Age {story.child_id}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose prose-lg max-w-none story-text animate-fade-in">
            <p className="whitespace-pre-wrap">{currentContent}</p>
          </div>
        </div>

        {showObjectives && story.learning_objectives && (
          <div className="border-t border-gray-100 p-6 sm:p-8 bg-gray-50">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
              <Target className="w-5 h-5 text-primary-600" />
              Learning Objectives
            </h2>
            <ol className="space-y-2">
              {story.learning_objectives.map((obj: any, index: number) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{obj.objective}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="border-t border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
              onClick={handlePrevParagraph}
              disabled={currentParagraph === 0}
              className="btn-outline flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex-1 flex items-center justify-center gap-4">
              <button
                onClick={() => setIsReading(!isReading)}
                className="p-3 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors"
                aria-label={isReading ? 'Pause reading' : 'Start reading'}
              >
                {isReading ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button
                className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Toggle volume"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {currentParagraph < paragraphs.length - 1 ? (
              <button
                onClick={handleNextParagraph}
                className="btn-primary flex items-center gap-2 ml-auto"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStartAssessment}
                className="btn-primary flex items-center gap-2 ml-auto"
              >
                Start Questions
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </article>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          After reading, you'll answer questions to check your understanding.
        </p>
      </div>
    </div>
  );
}
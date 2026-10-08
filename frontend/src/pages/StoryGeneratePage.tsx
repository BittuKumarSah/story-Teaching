import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useChildren } from '../contexts/ChildContext';
import { storiesApi } from '../services/api';
import { BookOpen, Sparkles, Loader2, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn } from '../utils/helpers';

export default function StoryGeneratePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedChild, children } = useChildren();
  const [story, setStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const topic = searchParams.get('topic') || '';
  const subject = searchParams.get('subject') || '';
  const difficulty = (searchParams.get('difficulty') as any) || 'beginner';

  useEffect(() => {
    if (!selectedChild) {
      navigate('/children');
      return;
    }

    const generateStory = async () => {
      setIsLoading(true);
      setProgress(0);
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 500);

      try {
        const response = await storiesApi.generate({
          topic,
          age: selectedChild.age,
          subject: subject || undefined,
          difficulty,
          language: 'English',
          child_id: selectedChild.id,
        });
        clearInterval(progressInterval);
        setProgress(100);
        setStory(response.data);
        
        setTimeout(() => {
          navigate(`/story/${response.data.id}`);
        }, 1000);
      } catch (err: any) {
        clearInterval(progressInterval);
        setError(err.response?.data?.detail || 'Failed to generate story. Please try again.');
        setIsLoading(false);
      }
    };

    generateStory();
  }, [selectedChild, topic, subject, difficulty, navigate]);

  if (!selectedChild) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  const steps = [
    { label: 'Analyzing topic', icon: BookOpen },
    { label: 'Designing learning objectives', icon: Sparkles },
    { label: 'Writing age-appropriate story', icon: BookOpen },
    { label: 'Creating comprehension questions', icon: Sparkles },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Creating story for {selectedChild.name}, age {selectedChild.age}</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Generating Your Story
        </h1>
        <p className="text-gray-600">Topic: <span className="font-medium text-gray-900">{topic}</span></p>
      </div>

      {error && (
        <div className="card p-6 mb-6 border-red-200">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Unable to generate story</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 btn-outline w-full"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && isLoading && (
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-primary-600">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const stepProgress = (index + 1) * 25;
              const isComplete = progress >= stepProgress;
              const isCurrent = progress >= stepProgress - 25 && progress < stepProgress;
              
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all',
                    isComplete ? 'bg-green-50' : isCurrent ? 'bg-primary-50' : 'bg-gray-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                      isComplete ? 'bg-green-100 text-green-600' : isCurrent ? 'bg-primary-100 text-primary-600 animate-pulse' : 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    'font-medium',
                    isComplete ? 'text-green-800' : isCurrent ? 'text-primary-800' : 'text-gray-600'
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <LoadingSpinner size="md" message="Our AI is crafting a magical learning adventure..." />
        </div>
      )}

      {story && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Story ready!</p>
              <p className="text-sm text-green-600">Redirecting to story reader...</p>
            </div>
          </div>
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
}
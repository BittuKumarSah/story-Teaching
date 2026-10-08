import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  CheckCircle, AlertCircle, Target, Sparkles, ArrowRight, 
  BookOpen, ArrowLeft, TrendingUp, Award, Brain 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn, getUnderstandingColor, getUnderstandingLabel } from '../utils/helpers';

export default function ResultsPage() {
  const { assessmentId } = useParams();
  const assessmentIdNum = parseInt(assessmentId || '0', 10);
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/assessments/${assessmentIdNum}`);
        setResult(response.data);
      } catch (err) {
        setError('Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResult();
  }, [assessmentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Calculating your results..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Unable to load results</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="mt-4 btn-primary">Back to Home</button>
      </div>
    );
  }

  const { percentage, understanding_level, strong_objectives, weak_objectives, recommendation, next_activity, results } = result;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Assessment Complete</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Learning Report</h1>
        <p className="text-gray-600">Here's how well you understood the concepts</p>
      </div>

      <div className="card p-6 sm:p-8 text-center">
        <div className="relative mx-auto mb-6" style={{ width: '160px', height: '160px' }}>
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${percentage / 100 * 439.8} 439.8`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">{Math.round(percentage)}%</p>
              <p className={cn('text-sm font-medium mt-1', getUnderstandingColor(percentage))}>
                {getUnderstandingLabel(percentage)}
              </p>
            </div>
          </div>
        </div>

        <p className="text-lg text-gray-700 max-w-md mx-auto">
          <span className="font-semibold">{understanding_level}</span>
          {next_activity && (
            <>
              <br />
              <span className="text-primary-600">Next: {next_activity.topic}</span>
            </>
          )}
        </p>
      </div>

      {(strong_objectives.length > 0 || weak_objectives.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {strong_objectives.length > 0 && (
            <div className="card p-6 border-l-4 border-green-500">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-semibold">Strong Concepts ({strong_objectives.length})</h3>
              </div>
              <ul className="space-y-2">
                {strong_objectives.map((obj: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-green-800 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {weak_objectives.length > 0 && (
            <div className="card p-6 border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 text-yellow-700 mb-3">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-semibold">Needs Practice ({weak_objectives.length})</h3>
              </div>
              <ul className="space-y-2">
                {weak_objectives.map((obj: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          Your Answers
        </h3>
        <div className="space-y-4">
          {results?.map((r: any, idx: number) => (
            <div
              key={idx}
              className={cn(
                'p-4 rounded-xl border',
                r.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="font-medium text-gray-900 flex-1">{r.question}</p>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
                  r.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                )}>
                  {r.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Your answer: <span className="font-medium">{r.user_answer}</span></p>
                {!r.is_correct && (
                  <p>Correct answer: <span className="font-medium text-green-700">{r.correct_answer}</span></p>
                )}
                {r.explanation && (
                  <p className="text-primary-700"><span className="font-medium">Why:</span> {r.explanation}</p>
                )}
                {r.objective && (
                  <p className="text-xs text-gray-500">Tests: {r.objective}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Recommendation</h3>
            <p className="text-primary-100 mb-4">{recommendation}</p>
            {next_activity && (
              <button
                onClick={() => navigate(`/generate?topic=${encodeURIComponent(next_activity.topic)}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Try: {next_activity.topic}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          View Dashboard
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-outline flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          New Story
        </button>
      </div>
    </div>
  );
}
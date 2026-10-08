import { useEffect, useState } from 'react';
import { useChildren } from '../contexts/ChildContext';
import { reportsApi } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  BookOpen, TrendingUp, Target, Award, Sparkles, 
  ArrowRight, Users, Clock, Star, CheckCircle 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn, formatDate, getUnderstandingColor, getUnderstandingLabel } from '../utils/helpers';

export default function DashboardPage() {
  const { selectedChild, children, fetchChildren } = useChildren();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedChild) {
      fetchReport();
    }
  }, [selectedChild]);

  const fetchReport = async () => {
    if (!selectedChild) return;
    setIsLoading(true);
    try {
      const response = await reportsApi.childReport(selectedChild.id);
      setReport(response.data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedChild) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No child selected</h2>
        <p className="text-gray-600 mb-6">Please select a child to view their dashboard</p>
        <Link to="/children" className="btn-primary">
          Manage Children
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchReport} className="mt-4 btn-outline">Retry</button>
      </div>
    );
  }

  const avgScore = report?.average_understanding || 0;
  const storiesCompleted = report?.stories_completed || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            {selectedChild.name}'s Dashboard
          </h1>
          <p className="text-gray-600">Age {selectedChild.age} • Grade {selectedChild.grade || 'N/A'}</p>
        </div>
        <Link to="/generate" className="btn-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          New Story
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{storiesCompleted}</p>
              <p className="text-sm text-gray-500">Stories Completed</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgScore.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Avg Understanding</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{report?.strong_concepts?.length || 0}</p>
              <p className="text-sm text-gray-500">Strong Concepts</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{report?.recommended_next?.length || 0}</p>
              <p className="text-sm text-gray-500">Recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            Strong Concepts
          </h2>
          {report?.strong_concepts?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.strong_concepts.slice(0, 8).map((concept: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700 border border-green-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Complete more stories to see strong concepts</p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Target className="w-5 h-5 text-orange-500" />
            Needs Practice
          </h2>
          {report?.weak_concepts?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.weak_concepts.slice(0, 8).map((concept: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-700 border border-yellow-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No concepts needing practice yet!</p>
          )}
        </div>
      </div>

      {report?.recommended_next?.length > 0 && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Recommended Next Steps
          </h2>
          <div className="space-y-3">
            {report.recommended_next.slice(0, 3).map((rec: any, idx: number) => (
              <Link
                key={idx}
                to={`/generate?topic=${encodeURIComponent(rec.topic)}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rec.topic}</p>
                    <p className="text-sm text-gray-500">{rec.reason}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {report?.recent_topics?.length > 0 && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Clock className="w-5 h-5 text-gray-500" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {report.recent_topics.slice(0, 5).map((topic: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{topic.title}</p>
                    <p className="text-sm text-gray-500">{topic.topic} • {formatDate(topic.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold', getUnderstandingColor(topic.score))}>
                    {topic.score.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">{getUnderstandingLabel(topic.score)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report?.progress_over_time?.length > 0 && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Progress Over Time
          </h2>
          <div className="h-64 relative">
            <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              {report.progress_over_time.map((point: any, idx: number) => {
                const x = (idx / (report.progress_over_time.length - 1 || 1)) * 400;
                const y = 200 - (point.percentage / 100) * 180;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#0ea5e9"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
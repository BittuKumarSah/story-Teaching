import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storiesApi } from '../services/api';
import { BookOpen, ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, Target } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { cn } from '../utils/helpers';

type QuestionType = 'mcq' | 'true_false' | 'fill_in_blank' | 'scenario' | 'sequencing';

interface Question {
  id: number;
  question: string;
  type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  objective?: string;
  order_index: number;
}

export default function AssessmentPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await storiesApi.getQuestions(parseInt(storyId!));
        setQuestions(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [storyId]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const currentAnswer = answers[currentQuestion?.id] || '';

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      setError('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const submitData = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: parseInt(questionId),
          answer,
        })),
      };

      const response = await storiesApi.assess(parseInt(storyId!), submitData);
      navigate(`/results/${response.data.assessment_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading questions..." />
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-red-50">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Unable to load assessment</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="mt-4 btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => (
              <label
                key={idx}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  currentAnswer === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleAnswerChange(option)}
                  className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-lg text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className={cn(
                  'flex items-center justify-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all text-lg font-medium',
                  currentAnswer === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleAnswerChange(option)}
                  className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'fill_in_blank':
        return (
          <div>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input text-center text-xl font-medium"
              placeholder="Type your answer here..."
              autoComplete="off"
            />
          </div>
        );

      case 'scenario':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => (
              <label
                key={idx}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  currentAnswer === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={() => handleAnswerChange(option)}
                  className="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 mt-1"
                />
                <span className="text-gray-800">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'sequencing':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Enter the correct order (comma-separated):</p>
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="input text-center"
              placeholder="e.g., A, B, C, D"
              autoComplete="off"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/story/${storyId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back to story"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Question</span>
          <span className="font-medium">{currentIndex + 1}</span>
          <span>/</span>
          <span>{questions.length}</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Target className="w-4 h-4" />
            <span>Tests: {currentQuestion.objective || 'Understanding'}</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{currentQuestion.question}</h2>
        </div>

        <div className="p-6">
          {renderQuestion()}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-2" role="navigation" aria-label="Question navigation">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                    idx === currentIndex
                      ? 'bg-primary-600 text-white'
                      : answers[questions[idx]?.id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  aria-label={`Question ${idx + 1}`}
                  aria-current={idx === currentIndex ? 'step' : undefined}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="btn-outline"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="btn-primary"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || answeredCount < questions.length}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Submit Answers
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
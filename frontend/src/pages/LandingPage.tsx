import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChildren } from '../contexts/ChildContext';
import { BookOpen, Sparkles, Target, Brain, ArrowRight, Plus, Users, Clock, Star, AlertCircle } from 'lucide-react';
import { cn } from '../utils/helpers';

const features = [
  {
    icon: Sparkles,
    title: 'Engaging Stories',
    description: 'Every concept becomes an adventure with relatable characters and exciting plots that keep children engaged.',
  },
  {
    icon: Target,
    title: 'Age-Adapted Content',
    description: 'Vocabulary, complexity, and examples automatically adjust to your child\'s age (6-12 years).',
  },
  {
    icon: Brain,
    title: 'Real Understanding Check',
    description: 'Interactive questions measure actual comprehension, not just story recall. Get detailed learning reports.',
  },
  {
    icon: Star,
    title: 'Personalized Recommendations',
    description: 'AI identifies strong and weak concepts, then suggests the perfect next story or practice activity.',
  },
];

const subjects = [
  { name: 'Mathematics', topics: ['Fractions', 'Multiplication', 'Geometry', 'Decimals', 'Measurement'] },
  { name: 'Science', topics: ['Water Cycle', 'Photosynthesis', 'Gravity', 'Electricity', 'Plant Life'] },
  { name: 'English', topics: ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Phonics'] },
  { name: 'Social Studies', topics: ['Maps', 'History', 'Communities', 'Cultures', 'Geography'] },
];

export default function LandingPage() {
  const { children, selectedChild, fetchChildren, createChild } = useChildren();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !selectedChild) return;
    
    setIsGenerating(true);
    setError('');
    try {
      navigate(`/generate?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}&difficulty=${difficulty}`);
    } catch (err) {
      setError('Failed to start story generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickStart = async (quickTopic: string, quickSubject: string) => {
    if (!selectedChild) return;
    setTopic(quickTopic);
    setSubject(quickSubject);
    navigate(`/generate?topic=${encodeURIComponent(quickTopic)}&subject=${encodeURIComponent(quickSubject)}&difficulty=${difficulty}`);
  };

  if (children.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to StoryTeacher!</h1>
          <p className="text-gray-600 mb-8">Add your first child to start creating personalized learning stories.</p>
          <button
            onClick={() => navigate('/children')}
            className="btn-primary text-lg px-8 py-3"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Child
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Currently learning with {selectedChild?.name}, age {selectedChild?.age}</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          What should we learn today?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Enter any school topic and we'll create an engaging story that teaches the concept naturally,
          then checks understanding with interactive questions.
        </p>
      </section>

      <form onSubmit={handleGenerate} className="card p-6 sm:p-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="topic" className="label">Topic or Concept</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input text-lg"
              placeholder="e.g., Fractions, Water Cycle, Photosynthesis..."
              required
              disabled={isGenerating}
            />
          </div>

          <div>
            <label htmlFor="subject" className="label">Subject (optional)</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              disabled={isGenerating}
            >
              <option value="">Auto-detect</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Social Studies">Social Studies</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="label">Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="input"
              disabled={isGenerating}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating || !topic.trim() || !selectedChild}
          className="btn-primary w-full mt-6 text-lg py-4 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'Creating Story...' : 'Generate Story'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics by Subject</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subj) => (
            <div key={subj.name} className="card p-6 card-hover">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                {subj.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {subj.topics.map((topicName) => (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => handleQuickStart(topicName, subj.name)}
                    className="px-3 py-1.5 text-sm rounded-full bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-200 transition-colors"
                  >
                    {topicName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="card p-6 text-center card-hover">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary-100 flex items-center justify-center">
                <feature.icon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 sm:p-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to start the adventure?</h2>
          <p className="text-primary-100 mb-6">Join thousands of parents and teachers making learning magical through stories.</p>
          <Link
            to="/generate"
            className="btn-secondary text-lg px-8 py-3 inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Create Your First Story
          </Link>
        </div>
      </section>
    </div>
  );
}
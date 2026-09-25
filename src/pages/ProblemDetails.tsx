import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchChapters, fetchTopics, fetchProblems } from '../services/sheetService';
import type { Chapter, Topic, Problem } from '../types/sheet';

const ProblemDetails: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [progress, setProgress] = useState<'not_started' | 'in_progress' | 'completed' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert YouTube URL to embed URL
  const youtubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11
      ? `https://www.youtube.com/embed/${match[7]}`
      : null;
  };

  // Helper to get display label for practice URL
  const getPracticeLabel = (url: string | undefined): string => {
    if (!url) return 'Practice';
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return `Practice on ${hostname.charAt(0).toUpperCase() + hostname.slice(1)}`;
    } catch {
      return 'Practice';
    }
  };

  // Helper to get display label for article URL
  const getArticleLabel = (url: string | undefined): string => {
    if (!url) return 'Article';
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      return `Read on ${hostname.charAt(0).toUpperCase() + hostname.slice(1)}`;
    } catch {
      return 'Article';
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch problem
        const probRes = await api.get(`/api/problems/${problemId}`);
        setProblem(probRes.data);

        // Fetch topic
        if (probRes.data.topicId) {
          const topicRes = await api.get(`/api/topics/${probRes.data.topicId}`);
          setTopic(topicRes.data);

          // Fetch chapter
          if (topicRes.data.chapterId) {
            const chapRes = await api.get(`/api/chapters/${topicRes.data.chapterId}`);
            setChapter(chapRes.data);
          }
        }

        // Fetch progress for this problem (to know completion state)
        const progRes = await api.get('/api/progress');
        const progressList = progRes.data.progress || [];
        const progEntry = progressList.find((p: any) => p.problemId === problemId);
        setProgress(progEntry ? progEntry.status : 'not_started');
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Failed to load problem details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [problemId]);

  // Helper to cycle status: not_started -> in_progress -> completed -> not_started
  const cycleStatus = (current: 'not_started' | 'in_progress' | 'completed'): 'not_started' | 'in_progress' | 'completed' => {
    if (current === 'not_started') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return 'not_started';
  };

  const handleToggleComplete = async () => {
    if (!problem) return;
    try {
      const current = progress ?? 'not_started';
      const next = cycleStatus(current);
      await api.put(`/api/progress/${problemId}`, {
        status: next,
      });
      // update local state
      setProgress(next);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full border-4 border-indigo-600 border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto mt-10 bg-red-50 border-l-4 border-red-500 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  if (!problem) return <div>Loading...</div>;

  const embedUrl = youtubeEmbedUrl(problem.youtubeUrl);
  const practiceLabel = getPracticeLabel(problem.practiceUrl);
  const articleLabel = getArticleLabel(problem.articleUrl);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          {/* HOME ICON NAVIGATION - Made more obvious and clickable */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 hover:text-indigo-500 font-medium"
          >
            ← Back to DSA Sheet
          </Link>
        </div>
        <div className="flex space-x-2">
          {/* HOME ICON NAVIGATION - Home button made more obvious */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Home
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{problem.title}</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      problem.difficulty === 'Easy'
                        ? 'bg-green-100 text-green-800'
                        : problem.difficulty === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  {chapter && topic && (
                    <span className="text-sm text-gray-500">
                      {chapter.title} &gt; {topic.title}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* MAKE PROBLEM STATUS CONTROL MORE OBVIOUS - Improved status section */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">Status:</span>
                  <select
                    value={progress ?? 'not_started'}
                    onChange={(e) => {
                      handleToggleComplete();
                    }}
                    className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Problem status"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </header>

          {/* Description */}
          {problem.description && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700">{problem.description}</p>
            </section>
          )}

          {/* Learning Section (YouTube) */}
          {embedUrl && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Learn</h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="relative w-full aspect-video">
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-md"
                    src={embedUrl}
                    title="YouTube tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </section>
          )}

          {/* Resources Section */}
          {(problem.practiceUrl || problem.articleUrl) && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* CONVERT practiceUrl INTO A PROPER BUTTON */}
                {problem.practiceUrl && (
                  <a
                    href={problem.practiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-white rounded-lg shadow-md p-4 flex items-center justify-center hover:bg-indigo-50 transition-colors"
                  >
                    Practice Problem ↗
                  </a>
                )}
                {problem.articleUrl && (
                  <a
                    href={problem.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white rounded-lg shadow-md p-4 flex items-center justify-between hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{articleLabel}</p>
                      <p className="text-sm text-gray-500">Review theory and approach</p>
                    </div>
                    <span className="text-indigo-600">
                      →
                    </span>
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProblemDetails;
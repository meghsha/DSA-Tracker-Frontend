import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { fetchChapters, fetchTopics, fetchProblems } from '../services/sheetService';
import type { Chapter, Topic, Problem } from '../types/sheet';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topicsMap, setTopicsMap] = useState<Map<string, Topic[]>>(new Map());
  const [problemsMap, setProblemsMap] = useState<Map<string, Problem[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  } | null>(null);

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch chapters
        const chaptersData = await fetchChapters();
        setChapters(chaptersData);

        // Fetch progress summary
        const progRes = await api.get('/api/progress');
        setProgress(progRes.data.summary);

        // For each chapter, fetch topics
        for (const chap of chaptersData) {
          const topicsData = await fetchTopics(chap._id);

          topicsMap.set(chap._id, topicsData);
          setTopicsMap(new Map(topicsMap));

          // For each topic, fetch problems
          for (const topic of topicsData) {
            const problemsData = await fetchProblems(topic._id);

            problemsMap.set(topic._id, problemsData);
            setProblemsMap(new Map(problemsMap));
          }
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ?? 'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login', { replace: true });
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-semibold text-indigo-600">
            DSA Tracker
          </span>
        </div>

        <div className="flex space-x-4">
          <Link
            to="/chapters"
            className="text-gray-600 hover:text-indigo-600 font-medium"
          >
            DSA Sheet
          </Link>

          <Link
            to="/planner"
            className="text-gray-600 hover:text-indigo-600 font-medium"
          >
            Study Planner
          </Link>

          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600 font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          <section className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>

            <p className="text-gray-600">
              Ready to track your DSA preparation? Here's your progress overview.
            </p>
          </section>

          {/* Progress summary */}
          {progress && (
            <section className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Progress Overview
              </h2>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {progress.completed}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Total Problems</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {progress.total}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2.5 w-full">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>

                <p className="mt-2 text-sm text-gray-600 text-center">
                  {progress.percentage}% completed
                </p>
              </div>
            </section>
          )}

          {/* DSA Sheet section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              DSA Sheet
            </h2>

            {chapters.length === 0 ? (
              <p className="text-gray-500">No chapters available.</p>
            ) : (
              <div className="space-y-6">
                {chapters.map((chapter) => (
                  <div
                    key={chapter._id}
                    className="border rounded-lg overflow-hidden shadow-sm"
                  >
                    {/* Chapter header */}
                    <div
                      className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer"
                      onClick={() =>
                        setExpandedChapterId(
                          expandedChapterId === chapter._id
                            ? null
                            : chapter._id
                        )
                      }
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>

                        <span className="font-medium text-gray-800">
                          {chapter.title}
                        </span>
                      </div>

                      {/* Expand/collapse icon */}
                      <span className="text-indigo-500">
                        {expandedChapterId === chapter._id ? '▾' : '▸'}
                      </span>
                    </div>

                    {/* Chapter topics (if expanded) */}
                    {expandedChapterId === chapter._id && (
                      <div className="border-t bg-white">
                        {topicsMap.get(chapter._id)?.length === 0 ? (
                          <p className="px-4 py-2 text-gray-500 text-sm">
                            No topics in this chapter.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {topicsMap
                              .get(chapter._id)
                              ?.map((topic) => (
                                <div
                                  key={topic._id}
                                  className="border-t px-4"
                                >
                                  <div
                                    className="flex items-center justify-between py-2 cursor-pointer"
                                    onClick={() =>
                                      setExpandedTopicId(
                                        expandedTopicId === topic._id
                                          ? null
                                          : topic._id
                                      )
                                    }
                                  >
                                    <div className="flex items-center space-x-2 text-sm">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>

                                      <span className="font-medium text-gray-700">
                                        {topic.title}
                                      </span>
                                    </div>

                                    <span className="text-gray-400">
                                      {expandedTopicId === topic._id
                                        ? '▾'
                                        : '▸'}
                                    </span>
                                  </div>

                                  {/* Topic problems (if expanded) */}
                                  {expandedTopicId === topic._id && (
                                    <div className="mt-2 space-y-2">
                                      {problemsMap.get(topic._id)?.length ===
                                      0 ? (
                                        <p className="px-4 text-gray-500 text-sm">
                                          No problems in this topic.
                                        </p>
                                      ) : (
                                        <div className="space-y-1">
                                          {problemsMap
                                            .get(topic._id)
                                            ?.map((problem) => (
                                              <div
                                                key={problem._id}
                                                className="flex items-center px-3 py-2 bg-gray-50 rounded-md"
                                              >
                                                <div className="flex-shrink-0 w-3 h-3">
                                                  {/* Difficulty badge */}
                                                  <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                      problem.difficulty ===
                                                      'Easy'
                                                        ? 'bg-green-100 text-green-800'
                                                        : problem.difficulty ===
                                                            'Medium'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : 'bg-red-100 text-red-800'
                                                    }`}
                                                  >
                                                    {problem.difficulty}
                                                  </span>
                                                </div>

                                                <div className="flex-1 ml-3">
                                                  <p className="text-sm font-medium text-gray-800">
                                                    {problem.title}
                                                  </p>

                                                  {problem.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                      {problem.description}
                                                    </p>
                                                  )}
                                                </div>

                                                <div className="flex-shrink-0 text-xs">
                                                  {/* Status placeholder – could be fetched from progress */}
                                                  <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                                                    Not started
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
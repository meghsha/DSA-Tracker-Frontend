import api from './api';
import type { Chapter, Topic, Problem } from '../types/sheet';

export const fetchChapters = async (): Promise<Chapter[]> => {
  const res = await api.get('/api/chapters');
  return res.data;
};

export const fetchTopics = async (chapterId: string): Promise<Topic[]> => {
  const res = await api.get(`/api/topics/${chapterId}`);
  return res.data;
};

export const fetchProblems = async (topicId: string): Promise<Problem[]> => {
  const res = await api.get(`/api/problems/topic/${topicId}`);
  return res.data;
};

import api from './api';
import type { Chapter, Topic, Problem } from '../types/sheet';

export const fetchChapters = async (): Promise<Chapter[]> => {
  const res = await api.get('/chapters');
  return res.data;
};

export const fetchTopics = async (chapterId: string): Promise<Topic[]> => {
  const res = await api.get(`/topics/${chapterId}`);
  return res.data;
};

export const fetchProblems = async (topicId: string): Promise<Problem[]> => {
  const res = await api.get(`/problems/topic/${topicId}`);
  return res.data;
};

export const fetchDSTree = async (): Promise<ChapterWithTopicsAndProblems[]> => {
  const res = await api.get('/chapters/tree');
  return res.data;
};

// Extended types for the tree structure
export interface ChapterWithTopicsAndProblems extends Chapter {
  topics: TopicWithProblems[];
}

export interface TopicWithProblems extends Topic {
  problems: Problem[];
}

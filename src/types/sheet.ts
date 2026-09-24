export interface Chapter {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  _id: string;
  title: string;
  description?: string;
  order?: number;
  chapterId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Problem {
  _id: string;
  title: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  youtubeUrl?: string;
  practiceUrl?: string;
  articleUrl?: string;
  topicId: string;
  createdAt?: string;
  updatedAt?: string;
}

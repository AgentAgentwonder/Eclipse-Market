export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: CourseLevel;
  category: string;
  durationMinutes: number;
  xpReward: number;
  badgeId?: string | null;
  prerequisites: string[];
  tags: string[];
  thumbnailUrl?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  contentType: 'video' | 'tutorial' | 'article' | 'quiz' | 'challenge' | 'webinar' | 'livesession';
  contentUrl?: string | null;
  contentData?: string | null;
  orderIndex: number;
  durationMinutes: number;
  xpReward: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseLevel;
  xpReward: number;
  badgeId?: string | null;
  requirements: string;
  validationCriteria: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export interface Webinar {
  id: string;
  title: string;
  description: string;
  instructor: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants?: number | null;
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  xpReward: number;
  status: string;
  createdAt: string;
}

export interface BadgeSummary {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  iconUrl?: string | null;
  xpReward: number;
  reputationBoost: number;
}

export interface Certificate {
  id: string;
  walletAddress: string;
  courseId?: string | null;
  challengeId?: string | null;
  title: string;
  description: string;
  issuedAt: string;
  certificateUrl?: string | null;
  verificationCode: string;
}

export interface LeaderboardEntry {
  walletAddress: string;
  rank: number;
  totalXp: number;
  coursesCompleted: number;
  badgesCount: number;
  streakDays: number;
}

export interface Mentor {
  id: string;
  walletAddress: string;
  name: string;
  bio: string;
  expertiseAreas: string[];
  languages: string[];
  availability: string;
  rating: number;
  totalSessions: number;
  isActive: boolean;
  createdAt: string;
}

export interface MentorSessionRequest {
  topic: string;
  scheduledAt: string;
  durationMinutes: number;
}

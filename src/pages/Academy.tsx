import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Award,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  AcademyDashboard,
  CourseCatalog,
  CourseViewer,
  ProgressDashboard,
  LeaderboardView,
  MentorMatching,
  ChallengeBoard,
} from '../components/academy';
import { useWalletStore } from '../store/walletStore';

type AcademyTab = 'dashboard' | 'courses' | 'progress' | 'challenges' | 'leaderboard' | 'mentors';

interface Stats {
  totalCourses: number;
  totalLessons: number;
  totalChallenges: number;
  totalWebinars: number;
  totalMentors: number;
  activeStudents: number;
}

interface UserStats {
  walletAddress: string;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalChallengesCompleted: number;
  totalWebinarsAttended: number;
  totalMentorSessions: number;
  totalXp: number;
  currentStreakDays: number;
  longestStreakDays: number;
  badgesEarned: string[];
}

export default function Academy() {
  const [activeTab, setActiveTab] = useState<AcademyTab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const publicKey = useWalletStore(state => state.publicKey);
  const walletAddress = publicKey || '';

  useEffect(() => {
    loadData();
  }, [walletAddress]);

  const loadData = async () => {
    try {
      setLoading(true);
      const contentStats = await invoke<Stats>('get_content_stats');
      setStats(contentStats);

      if (walletAddress) {
        const userStatsData = await invoke<UserStats>('get_user_stats', {
          walletAddress,
        });
        setUserStats(userStatsData);
      }
    } catch (error) {
      console.error('Failed to load academy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: GraduationCap },
    { id: 'courses' as const, label: 'Courses', icon: BookOpen },
    { id: 'progress' as const, label: 'My Progress', icon: TrendingUp },
    { id: 'challenges' as const, label: 'Challenges', icon: Trophy },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Award },
    { id: 'mentors' as const, label: 'Mentors', icon: Users },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            Eclipse Academy
          </h1>
          <p className="text-muted-foreground mt-1">
            Master trading and DeFi with interactive courses, challenges, and expert guidance
          </p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Courses</div>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </div>
            <div className="bg-card rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Students</div>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
            </div>
            {userStats && (
              <div className="bg-card rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Your XP</div>
                <div className="text-2xl font-bold">{userStats.totalXp}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <AcademyDashboard
            stats={stats}
            userStats={userStats}
            walletAddress={walletAddress}
            onCourseSelect={courseId => {
              setSelectedCourseId(courseId);
              setActiveTab('courses');
            }}
          />
        )}

        {!loading && activeTab === 'courses' && selectedCourseId && (
          <CourseViewer
            courseId={selectedCourseId}
            walletAddress={walletAddress}
            onBack={() => setSelectedCourseId(null)}
          />
        )}

        {!loading && activeTab === 'courses' && !selectedCourseId && (
          <CourseCatalog
            onCourseSelect={courseId => setSelectedCourseId(courseId)}
          />
        )}

        {!loading && activeTab === 'progress' && (
          <ProgressDashboard
            walletAddress={walletAddress}
            userStats={userStats}
          />
        )}

        {!loading && activeTab === 'challenges' && (
          <ChallengeBoard walletAddress={walletAddress} />
        )}

        {!loading && activeTab === 'leaderboard' && (
          <LeaderboardView />
        )}

        {!loading && activeTab === 'mentors' && (
          <MentorMatching walletAddress={walletAddress} />
        )}
      </motion.div>
    </div>
  );
}

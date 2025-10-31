import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  Gift,
  Medal,
  ArrowRight,
  PlayCircle,
  BookOpen,
  Trophy,
  Video,
} from 'lucide-react';
import BadgeDisplay from './BadgeDisplay';
import LessonPlayer from './LessonPlayer';

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
  contentType: string;
  contentUrl?: string | null;
  contentData?: string | null;
  orderIndex: number;
  durationMinutes: number;
  xpReward: number;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
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
  meetingUrl?: string | null;
  recordingUrl?: string | null;
  xpReward: number;
  status: string;
  createdAt: string;
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

interface AcademyDashboardProps {
  stats: {
    totalCourses: number;
    totalLessons: number;
    totalChallenges: number;
    totalWebinars: number;
    totalMentors: number;
    activeStudents: number;
  } | null;
  userStats: UserStats | null;
  walletAddress: string;
  onCourseSelect: (courseId: string) => void;
}

interface BadgeSummary {
  id: string;
  name: string;
  description: string;
  rarity: string;
  iconUrl?: string | null;
  xpReward: number;
  reputationBoost: number;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-500',
  intermediate: 'bg-sky-500/10 text-sky-500',
  advanced: 'bg-amber-500/10 text-amber-500',
  expert: 'bg-rose-500/10 text-rose-500',
};

export default function AcademyDashboard({ stats, userStats, walletAddress, onCourseSelect }: AcademyDashboardProps) {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [upcomingWebinars, setUpcomingWebinars] = useState<Webinar[]>([]);
  const [recentBadges, setRecentBadges] = useState<BadgeSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [walletAddress]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const courses = await invoke<Course[]>('list_courses', {});
      setFeaturedCourses(courses.slice(0, 4));

      const challenges = await invoke<Challenge[]>('list_challenges', { activeOnly: true });
      setActiveChallenges(challenges.slice(0, 3));

      const webinars = await invoke<Webinar[]>('list_webinars', { status: 'scheduled' });
      setUpcomingWebinars(webinars.slice(0, 3));

      if (walletAddress) {
        const badges = await invoke<BadgeSummary[]>('get_user_badges', { walletAddress });
        setRecentBadges(badges.slice(0, 4));
      } else {
        setRecentBadges([]);
      }
    } catch (error) {
      console.error('Failed to load academy dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User summary */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <SummaryCard
          icon={Flame}
          label="Skill Streak"
          value={userStats?.currentStreakDays ?? 0}
          suffix="days"
          accent="bg-orange-500/10 text-orange-500"
          description={`Longest streak: ${userStats?.longestStreakDays ?? 0} days`}
        />
        <SummaryCard
          icon={Clock}
          label="Learning Time"
          value={Math.round((userStats?.totalLessonsCompleted ?? 0) * 15)}
          suffix="min"
          description={`${userStats?.totalCoursesCompleted ?? 0} courses completed`}
          accent="bg-blue-500/10 text-blue-500"
        />
        <SummaryCard
          icon={Gift}
          label="Total XP"
          value={userStats?.totalXp ?? 0}
          suffix="xp"
          description={`${userStats?.badgesEarned.length ?? 0} badges earned`}
          accent="bg-purple-500/10 text-purple-500"
        />
        <SummaryCard
          icon={Medal}
          label="Challenges"
          value={userStats?.totalChallengesCompleted ?? 0}
          description={`${userStats?.totalQuizzesPassed ?? 0} quizzes passed`}
          accent="bg-emerald-500/10 text-emerald-500"
        />
      </motion.div>

      {/* Featured courses */}
      <SectionCard
        title="Featured Learning Paths"
        icon={BookOpen}
        actionLabel="View all"
        onAction={() => onCourseSelect(featuredCourses[0]?.id ?? '')}
        loading={loading}
        emptyMessage="No courses available yet. Check back soon!"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCourses.map(course => (
            <motion.button
              key={course.id}
              onClick={() => onCourseSelect(course.id)}
              className="flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left shadow-sm transition-colors hover:border-primary/60"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${difficultyColors[course.level]}`}>
                  {course.level}
                </span>
                <span className="text-muted-foreground">{course.category}</span>
              </div>
              <h3 className="text-lg font-semibold leading-tight">{course.title}</h3>
              <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
              <div className="mt-auto flex w-full items-center justify-between text-xs text-muted-foreground">
                <span>{course.durationMinutes} min</span>
                <span>{course.xpReward} XP</span>
              </div>
            </motion.button>
          ))}
        </div>
      </SectionCard>

      {/* Active challenges & Webinars */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Live Challenges"
          icon={Trophy}
          actionLabel="View challenges"
          loading={loading}
          onAction={() => onCourseSelect(featuredCourses[0]?.id ?? '')}
          emptyMessage="No active challenges right now. New events coming soon!"
        >
          <div className="space-y-4">
            {activeChallenges.map(challenge => (
              <div key={challenge.id} className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{challenge.title}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${difficultyColors[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{challenge.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{challenge.category}</span>
                  <span>{challenge.xpReward} XP</span>
                  {challenge.badgeId && <span>Badge: {challenge.badgeId}</span>}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming Sessions"
          icon={Video}
          actionLabel="View webinars"
          loading={loading}
          emptyMessage="No upcoming webinars. Follow the schedule for updates."
        >
          <div className="space-y-4">
            {upcomingWebinars.map(webinar => (
              <div key={webinar.id} className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{webinar.title}</h3>
                  <span className="text-xs text-muted-foreground">{webinar.xpReward} XP</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{webinar.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(webinar.scheduledAt).toLocaleString()}</span>
                  <span>{webinar.durationMinutes} min</span>
                  <span>{webinar.instructor}</span>
                </div>
                {webinar.meetingUrl && (
                  <a
                    href={webinar.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Join session <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent achievements */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Latest Achievements"
          icon={Medal}
          loading={loading}
          emptyMessage={walletAddress ? 'Earn badges by completing courses and challenges!' : 'Connect a wallet to start earning badges.'}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {recentBadges.map(badge => (
              <BadgeDisplay key={badge.id} badge={badge} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Quick Start"
          icon={PlayCircle}
          loading={loading}
          emptyMessage="No lessons available yet."
        >
          <LessonPlayer
            onLaunch={() => onCourseSelect(featuredCourses[0]?.id ?? '')}
            walletAddress={walletAddress}
          />
        </SectionCard>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  description?: string;
  accent: string;
}

function SummaryCard({ icon: Icon, label, value, suffix, description, accent }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className={`mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">
        {value.toLocaleString()}
        {suffix && <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>}
      </div>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

function SectionCard({ title, icon: Icon, actionLabel, onAction, children, loading, emptyMessage }: SectionCardProps) {
  const isEmpty = !loading && (!children || (Array.isArray(children) && children.length === 0));

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {actionLabel && onAction && (
          <button onClick={onAction} className="text-sm font-medium text-primary hover:underline">
            {actionLabel}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          {emptyMessage ?? 'No content available yet.'}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

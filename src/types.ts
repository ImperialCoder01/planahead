export type GoalCategory = string;
export type GoalStatus = "active" | "completed" | "on_hold";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";
export type MilestoneStatus = "pending" | "completed";

export interface Profile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  health_score: number; // 0-100
  target_date: string;
  progress: number; // 0-100
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  order_index: number;
  status: MilestoneStatus;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  milestone_id?: string;
  goal_id?: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimated_minutes: number;
  actual_minutes: number;
  due_date: string;
  is_ai_generated: boolean;
  created_at: string;
  completed_at?: string;
  scheduled_date?: string;
  scheduled_hour?: number;
  google_event_id?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id?: string;
  duration_minutes: number;
  actual_minutes: number;
  xp_earned: number;
  completed: boolean;
  interrupted: boolean;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface MomentumScore {
  id: string;
  user_id: string;
  current_score: number;
  level: number;
  total_xp: number;
  streak_days: number;
  best_streak: number;
  last_active_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  xp_awarded: number;
  unlocked_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  type: string; // "prioritize" | "schedule" | "recommend" | "remind" | "habits"
  title: string;
  description: string;
  priority: Priority;
  metadata?: any;
  applied: boolean;
  dismissed: boolean;
  created_at: string;
}

export interface VoiceSession {
  id: string;
  user_id: string;
  audio_url?: string;
  transcript: string;
  intent: string;
  confidence: number;
  processed: boolean;
  action_taken?: string;
  created_at: string;
}

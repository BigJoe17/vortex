/**
 * Rewards Store
 *
 * Manages the rewards/points system for user engagement.
 */

import {create} from 'zustand';

export interface RewardActivity {
  id: string;
  type: 'daily_login' | 'first_transaction' | 'referral' | 'milestone';
  points: number;
  description: string;
  earnedAt: string;
}

interface RewardsState {
  // ── State ────────────────────────────────
  totalPoints: number;
  level: number;
  activities: RewardActivity[];
  streak: number;
  isLoading: boolean;

  // ── Actions ──────────────────────────────
  setTotalPoints: (points: number) => void;
  setLevel: (level: number) => void;
  setActivities: (activities: RewardActivity[]) => void;
  addActivity: (activity: RewardActivity) => void;
  setStreak: (streak: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  totalPoints: 0,
  level: 1,
  activities: [] as RewardActivity[],
  streak: 0,
  isLoading: false,
};

export const useRewardsStore = create<RewardsState>((set) => ({
  ...initialState,

  setTotalPoints: (totalPoints) => set({totalPoints}),
  setLevel: (level) => set({level}),
  setActivities: (activities) => set({activities}),
  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
      totalPoints: state.totalPoints + activity.points,
    })),
  setStreak: (streak) => set({streak}),
  setLoading: (isLoading) => set({isLoading}),

  reset: () => set(initialState),
}));

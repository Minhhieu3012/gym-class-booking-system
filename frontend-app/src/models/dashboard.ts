export interface DashboardStats {
  upcomingClasses: number;
  activeTrainers: number;
}

export interface DashboardClass {
  id: number;
  title: string;
  classTypeName: string;
  trainerName: string;
  roomName: string;
  startTime: string;
  endTime: string;
  currentCount: number;
  maxCapacity: number;
  status: string;
}

export interface DashboardTrainer {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  specialization: string;
  experienceYear: number;
  hourlyFee: number;
  bio: string;
}

export interface MemberDashboardResponse {
  stats: DashboardStats;
  upcomingClasses: DashboardClass[];
  trainers: DashboardTrainer[];
}
// src/types.ts
export interface User {
  id: string;
  username: string;
  accessCode: string;
  fullName: string;
  phone: string;
  role: 'admin' | 'student';
  groupId: string; // Keep for backward compatibility or main group
  groupIds?: string[]; // Multiple groups support
  school?: string;
  studentClass?: string;
  monthlyPaymentAmount?: number;
  isArchived?: boolean;
  createdAt: number;
}

export interface Group {
  id: string;
  name: string;
  studentIds: string[];
  schedule: string;
  isArchived?: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  groupId: string;
  date: string; // 'YYYY-MM-DD'
  status: 'present' | 'absent';
  markedBy: string;
  markedAt: number;
}

export interface Result {
  id: string;
  userId: string;
  date: string;
  score: number;
  maxScore: number;
  subject: string;
  type: 'daily' | 'monthly' | 'test';
  note: string;
}

export interface TestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Test {
  id: string;
  title: string;
  groupId: string;
  questions: TestQuestion[];
  createdAt: number;
  createdBy: string;
  isActive: boolean;
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: number[];
  submittedAt: number;
}

export interface Payment {
  id: string;
  userId: string;
  month: string; // 'YYYY-MM'
  status: 'paid' | 'debt' | 'pending';
  amount: number;
  paidAt: number | null;
  markedBy: string;
}

export interface AdminConfig {
  centerName: string;
  adminPhone: string;
  adminCode: string;
  eskizEmail: string;
  eskizPassword: string;
  smsEnabled: boolean;
}

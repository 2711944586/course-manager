export type TeacherStatus = 'active' | 'leave' | 'pending';

export interface Teacher {
  readonly id: number;
  readonly employeeNo: string;
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly email: string;
  readonly phone: string;
  readonly office: string;
  readonly expertise: readonly string[];
  readonly maxWeeklyHours: number;
  readonly currentWeeklyHours: number;
  readonly status: TeacherStatus;
  readonly active: boolean;
  readonly lastReviewAt: string;
  readonly updatedAt: string;
}

export interface TeacherUpsertInput {
  readonly employeeNo: string;
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly email: string;
  readonly phone: string;
  readonly office: string;
  readonly expertise: readonly string[];
  readonly maxWeeklyHours: number;
  readonly currentWeeklyHours: number;
  readonly status: TeacherStatus;
  readonly active: boolean;
}

export type TeacherSortKey = 'updatedAt' | 'name' | 'department' | 'title' | 'status' | 'load';

export const TEACHER_SORT_OPTIONS: readonly { readonly value: TeacherSortKey; readonly label: string }[] = [
  { value: 'updatedAt', label: '最近更新' },
  { value: 'name', label: '姓名' },
  { value: 'department', label: '院系' },
  { value: 'title', label: '职称' },
  { value: 'status', label: '状态' },
  { value: 'load', label: '负荷' },
];

export const TEACHER_STATUS_OPTIONS: readonly { readonly value: TeacherStatus; readonly label: string }[] = [
  { value: 'active', label: '在岗' },
  { value: 'leave', label: '休整' },
  { value: 'pending', label: '待排班' },
];

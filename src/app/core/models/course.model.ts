export type CourseStatus = 'planned' | 'active' | 'completed';

export interface Course {
  readonly id: number;
  readonly name: string;
  readonly teacherId?: number | null;
  readonly instructor: string;
  readonly schedule: string;
  readonly description: string;
  readonly progress: number;
  readonly students: number;
  readonly status: CourseStatus;
  readonly icon: string;
  readonly updatedAt: string;
}

export interface CourseUpsertInput {
  readonly name: string;
  readonly teacherId?: number | null;
  readonly instructor: string;
  readonly schedule: string;
  readonly description: string;
  readonly progress: number;
  readonly students: number;
  readonly status: CourseStatus;
  readonly icon: string;
}

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  planned: '未开始',
  active: '进行中',
  completed: '已结课',
};

export const COURSE_STATUS_OPTIONS: readonly { readonly value: CourseStatus; readonly label: string }[] = [
  { value: 'planned', label: '未开始' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已结课' },
];

export type CourseSortKey = 'updatedAt' | 'name' | 'progress' | 'students';

export const COURSE_SORT_OPTIONS: readonly { readonly value: CourseSortKey; readonly label: string }[] = [
  { value: 'updatedAt', label: '最近更新' },
  { value: 'name', label: '课程名称' },
  { value: 'progress', label: '学习进度' },
  { value: 'students', label: '学生人数' },
];

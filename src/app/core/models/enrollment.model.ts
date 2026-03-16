export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';

export interface Enrollment {
  readonly id: number;
  readonly studentId: number;
  readonly courseId: number;
  readonly score: number | null;
  readonly grade: string;
  readonly status: EnrollmentStatus;
  readonly enrollDate: string;
  readonly updatedAt: string;
}

export interface EnrollmentUpsertInput {
  readonly studentId: number;
  readonly courseId: number;
  readonly score: number | null;
  readonly status: EnrollmentStatus;
}

export const ENROLLMENT_STATUS_OPTIONS: readonly { readonly value: EnrollmentStatus; readonly label: string }[] = [
  { value: 'enrolled', label: '在读' },
  { value: 'completed', label: '已结课' },
  { value: 'dropped', label: '退课' },
];

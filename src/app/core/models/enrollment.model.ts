export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';
export type EnrollmentWorkflowStatus = 'draft' | 'pending-review' | 'approved' | 'rejected';
export type EnrollmentPriority = 'routine' | 'attention' | 'urgent';

export interface Enrollment {
  readonly id: number;
  readonly studentId: number;
  readonly courseId: number;
  readonly score: number | null;
  readonly grade: string;
  readonly status: EnrollmentStatus;
  readonly workflowStatus: EnrollmentWorkflowStatus;
  readonly priority: EnrollmentPriority;
  readonly operator: string;
  readonly decisionReason: string;
  readonly decisionAt: string | null;
  readonly slaDeadline: string;
  readonly riskFlags: readonly string[];
  readonly enrollDate: string;
  readonly updatedAt: string;
}

export interface EnrollmentUpsertInput {
  readonly studentId: number;
  readonly courseId: number;
  readonly score: number | null;
  readonly status: EnrollmentStatus;
  readonly workflowStatus?: EnrollmentWorkflowStatus;
  readonly priority?: EnrollmentPriority;
  readonly operator?: string;
  readonly decisionReason?: string;
}

export const ENROLLMENT_STATUS_OPTIONS: readonly { readonly value: EnrollmentStatus; readonly label: string }[] = [
  { value: 'enrolled', label: '在读' },
  { value: 'completed', label: '已结课' },
  { value: 'dropped', label: '退课' },
];

export const ENROLLMENT_WORKFLOW_OPTIONS: readonly { readonly value: EnrollmentWorkflowStatus; readonly label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'pending-review', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
];

export const ENROLLMENT_PRIORITY_OPTIONS: readonly { readonly value: EnrollmentPriority; readonly label: string }[] = [
  { value: 'routine', label: '常规' },
  { value: 'attention', label: '关注' },
  { value: 'urgent', label: '紧急' },
];

export type StudentGender = 'male' | 'female';

export interface Student {
  readonly id: number;
  readonly name: string;
  readonly studentNo: string;
  readonly gender: StudentGender;
  readonly birthDate: string;
  readonly score: number;
  readonly updatedAt: string;
}

export interface StudentUpsertInput {
  readonly name: string;
  readonly studentNo: string;
  readonly gender: StudentGender;
  readonly birthDate: string;
  readonly score: number;
}

export const STUDENT_GENDER_LABELS: Record<StudentGender, string> = {
  male: '男',
  female: '女',
};

export const STUDENT_GENDER_OPTIONS: readonly { readonly value: StudentGender; readonly label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

export type StudentSortKey = 'updatedAt' | 'name' | 'studentNo' | 'birthDate' | 'score';

export const STUDENT_SORT_OPTIONS: readonly { readonly value: StudentSortKey; readonly label: string }[] = [
  { value: 'updatedAt', label: '最近更新' },
  { value: 'name', label: '姓名' },
  { value: 'studentNo', label: '学号' },
  { value: 'birthDate', label: '出生日期' },
  { value: 'score', label: '成绩' },
];

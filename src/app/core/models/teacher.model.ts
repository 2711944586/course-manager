export interface Teacher {
  readonly id: number;
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly email: string;
  readonly active: boolean;
  readonly updatedAt: string;
}

export interface TeacherUpsertInput {
  readonly name: string;
  readonly title: string;
  readonly department: string;
  readonly email: string;
  readonly active: boolean;
}

export type TeacherSortKey = 'updatedAt' | 'name' | 'department' | 'title';

export const TEACHER_SORT_OPTIONS: readonly { readonly value: TeacherSortKey; readonly label: string }[] = [
  { value: 'updatedAt', label: '最近更新' },
  { value: 'name', label: '姓名' },
  { value: 'department', label: '院系' },
  { value: 'title', label: '职称' },
];

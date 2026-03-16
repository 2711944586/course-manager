export type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export const GRADE_LABELS: Record<Grade, string> = {
  A: '优秀',
  B: '良好',
  C: '中等',
  D: '及格',
  E: '不及格',
  F: '极差',
};

export const GRADE_ORDER: readonly Grade[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

export function isPassingGrade(grade: Grade): boolean {
  return grade === 'A' || grade === 'B' || grade === 'C' || grade === 'D';
}

export function isPassingScore(score: number): boolean {
  return score >= 60;
}

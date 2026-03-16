export const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;

export type WeekdayLabel = (typeof WEEKDAY_LABELS)[number];

export function extractCourseScheduleDays(schedule: string): readonly WeekdayLabel[] {
  const matchedDays = WEEKDAY_LABELS.filter(day => schedule.includes(day));
  return matchedDays.length > 0 ? matchedDays : ['周一'];
}

/** 检测排课冲突：同一讲师在同一天有多门活跃课程 */
export function detectScheduleConflicts(
  courses: readonly { readonly id: number; readonly instructor: string; readonly schedule: string; readonly status: string }[],
  newSchedule: string,
  newInstructor: string,
  excludeId?: number,
): readonly string[] {
  const newDays = extractCourseScheduleDays(newSchedule);
  const conflicts: string[] = [];

  for (const course of courses) {
    if (course.id === excludeId) continue;
    if (course.status === 'completed') continue;
    if (course.instructor !== newInstructor) continue;

    const existingDays = extractCourseScheduleDays(course.schedule);
    const overlapping = newDays.filter(day => existingDays.includes(day));

    if (overlapping.length > 0) {
      conflicts.push(`讲师「${newInstructor}」在${overlapping.join('、')}与课程 #${course.id} 存在排课冲突`);
    }
  }

  return conflicts;
}

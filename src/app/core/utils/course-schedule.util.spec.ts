import { detectScheduleConflicts, extractCourseScheduleDays } from './course-schedule.util';

describe('course-schedule util', () => {
  it('should extract multiple weekday labels from course schedule', () => {
    expect(extractCourseScheduleDays('周一 / 周三 09:00 - 10:30')).toEqual(['周一', '周三']);
  });

  it('should detect schedule conflicts for the same instructor on overlapping days', () => {
    const conflicts = detectScheduleConflicts(
      [
        { id: 1, instructor: '王教授', schedule: '周一 / 周三 09:00 - 10:30', status: 'active' },
        { id: 2, instructor: '李老师', schedule: '周二 14:00 - 15:30', status: 'active' },
        { id: 3, instructor: '王教授', schedule: '周五 08:00 - 09:30', status: 'completed' },
      ],
      '周三 / 周五 14:00 - 15:30',
      '王教授',
    );

    expect(conflicts.length).toBe(1);
    expect(conflicts[0]).toContain('周三');
  });
});

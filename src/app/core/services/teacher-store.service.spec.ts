import { TestBed } from '@angular/core/testing';
import { TeacherUpsertInput } from '../models/teacher.model';
import { TeacherStoreService } from './teacher-store.service';

describe('TeacherStoreService', () => {
  const teacherStorageKey = 'aurora.course-manager.teachers';
  const activityStorageKey = 'aurora.course-manager.activity-log';

  let service: TeacherStoreService;

  beforeEach(() => {
    localStorage.removeItem(teacherStorageKey);
    localStorage.removeItem(activityStorageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeacherStoreService);
  });

  afterEach(() => {
    localStorage.removeItem(teacherStorageKey);
    localStorage.removeItem(activityStorageKey);
  });

  it('should hydrate seed teachers with enterprise fields', () => {
    const teachers = service.teachers();

    expect(teachers.length).toBeGreaterThan(0);
    expect(teachers[0]?.employeeNo).toMatch(/^T\d{5,}$/);
    expect(teachers[0]?.expertise.length).toBeGreaterThan(0);
    expect(teachers[0]?.status).toBeDefined();
  });

  it('should create a teacher and keep employeeNo unique', () => {
    const payload: TeacherUpsertInput = {
      employeeNo: 'T39999',
      name: '测试教师',
      title: '讲师',
      department: '测试学院',
      email: 'teacher@example.edu.cn',
      phone: '13800001234',
      office: '测试楼 101',
      expertise: ['课程建设', '教学评估'],
      maxWeeklyHours: 12,
      currentWeeklyHours: 8,
      status: 'active',
      active: true,
    };

    const createdTeacher = service.createTeacher(payload);
    expect(createdTeacher.employeeNo).toBe('T39999');
    expect(createdTeacher.expertise).toEqual(['课程建设', '教学评估']);

    expect(() => service.createTeacher(payload)).toThrowError('教师工号已存在，请使用唯一工号');
  });

  it('should update teacher status and load', () => {
    const targetTeacher = service.teachers()[0];
    const updatedTeacher = service.updateTeacher(targetTeacher.id, {
      employeeNo: targetTeacher.employeeNo,
      name: targetTeacher.name,
      title: targetTeacher.title,
      department: targetTeacher.department,
      email: targetTeacher.email,
      phone: targetTeacher.phone,
      office: targetTeacher.office,
      expertise: [...targetTeacher.expertise],
      maxWeeklyHours: targetTeacher.maxWeeklyHours,
      currentWeeklyHours: targetTeacher.maxWeeklyHours + 2,
      status: 'pending',
      active: false,
    });

    expect(updatedTeacher.status).toBe('pending');
    expect(updatedTeacher.active).toBeFalse();
    expect(updatedTeacher.currentWeeklyHours).toBe(targetTeacher.maxWeeklyHours + 2);
  });
});

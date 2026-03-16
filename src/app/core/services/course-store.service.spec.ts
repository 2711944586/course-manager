import { TestBed } from '@angular/core/testing';
import { CourseUpsertInput } from '../models/course.model';
import { CourseStoreService } from './course-store.service';

describe('CourseStoreService', () => {
  const storageKey = 'aurora.course-manager.courses';

  let service: CourseStoreService;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseStoreService);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should load seed courses when storage is empty', () => {
    expect(service.courses().length).toBeGreaterThan(0);
  });

  it('should create a course and persist it', () => {
    const initialCount = service.courses().length;
    const payload: CourseUpsertInput = {
      name: '软件工程导论',
      instructor: '周老师',
      schedule: '周二 19:00 - 20:30',
      description: '覆盖软件生命周期、需求分析与质量保障实践。',
      progress: 0,
      students: 68,
      status: 'planned',
      icon: 'engineering',
    };

    const createdCourse = service.createCourse(payload);

    expect(createdCourse.id).toBeGreaterThan(0);
    expect(service.courses().length).toBe(initialCount + 1);

    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as unknown[];
    expect(persisted.length).toBe(initialCount + 1);
  });

  it('should update progress to 100 and mark as completed', () => {
    const targetCourse = service.courses()[0];
    const updatedCourse = service.updateProgress(targetCourse.id, 100);

    expect(updatedCourse.progress).toBe(100);
    expect(updatedCourse.status).toBe('completed');
  });

  it('should reject invalid progress when creating a course', () => {
    const invalidPayload: CourseUpsertInput = {
      name: '测试课程',
      instructor: '测试老师',
      schedule: '周一 10:00 - 12:00',
      description: '这是一个用于校验非法进度输入的测试课程描述。',
      progress: 120,
      students: 10,
      status: 'active',
      icon: 'menu_book',
    };

    expect(() => service.createCourse(invalidPayload)).toThrowError('课程进度需在 0 到 100 之间');
  });
});

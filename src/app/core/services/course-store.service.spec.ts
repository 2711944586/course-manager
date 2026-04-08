import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { buildApiUrl } from '../config/api.config';
import { CourseUpsertInput } from '../models/course.model';
import { CourseStoreService } from './course-store.service';

describe('CourseStoreService', () => {
  const storageKey = 'aurora.course-manager.courses';
  const coursesUrl = buildApiUrl('/courses');

  let service: CourseStoreService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CourseStoreService);
    httpTesting = TestBed.inject(HttpTestingController);

    const initialRequest = httpTesting.expectOne(coursesUrl);
    expect(initialRequest.request.method).toBe('GET');
    initialRequest.flush([...service.courses()]);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(storageKey);
  });

  it('should load seed courses when storage is empty', () => {
    expect(service.courses().length).toBeGreaterThan(0);
  });

  it('should create a course and persist it', async () => {
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

    const createPromise = service.createCourse(payload);
    const createRequest = httpTesting.expectOne(coursesUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: 10_001,
      ...payload,
      updatedAt: '2026-04-07T15:00:00.000Z',
    });

    const createdCourse = await createPromise;

    expect(createdCourse.id).toBeGreaterThan(0);
    expect(service.courses().length).toBe(initialCount + 1);

    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as unknown[];
    expect(persisted.length).toBe(initialCount + 1);
  });

  it('should update progress to 100 and mark as completed', async () => {
    const targetCourse = service.courses()[0];
    const updatePromise = service.updateProgress(targetCourse.id, 100);
    const updateRequest = httpTesting.expectOne(`${coursesUrl}/${targetCourse.id}`);
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({
      ...targetCourse,
      progress: 100,
      status: 'completed',
      updatedAt: '2026-04-07T15:10:00.000Z',
    });

    const updatedCourse = await updatePromise;

    expect(updatedCourse.progress).toBe(100);
    expect(updatedCourse.status).toBe('completed');
  });

  it('should reject invalid progress when creating a course', async () => {
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

    await expectAsync(service.createCourse(invalidPayload)).toBeRejectedWithError('课程进度需在 0 到 100 之间');
  });
});

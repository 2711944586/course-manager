import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { buildApiUrl } from '../config/api.config';
import { TeacherUpsertInput } from '../models/teacher.model';
import { TeacherStoreService } from './teacher-store.service';

describe('TeacherStoreService', () => {
  const teacherStorageKey = 'aurora.course-manager.teachers';
  const activityStorageKey = 'aurora.course-manager.activity-log';
  const coursesStorageKey = 'aurora.course-manager.courses';
  const coursesUrl = buildApiUrl('/courses');
  const teachersUrl = buildApiUrl('/teachers');

  let service: TeacherStoreService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(coursesStorageKey);
    localStorage.removeItem(teacherStorageKey);
    localStorage.removeItem(activityStorageKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TeacherStoreService);
    httpTesting = TestBed.inject(HttpTestingController);

    const initialCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(initialCoursesRequest.request.method).toBe('GET');
    initialCoursesRequest.flush([]);

    const initialRequest = httpTesting.expectOne(teachersUrl);
    expect(initialRequest.request.method).toBe('GET');
    initialRequest.flush([...service.teachers()]);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(coursesStorageKey);
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

  it('should create a teacher and keep employeeNo unique', async () => {
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

    const createPromise = service.createTeacher(payload);
    const createRequest = httpTesting.expectOne(teachersUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: 10_001,
      ...payload,
      lastReviewAt: '2026-04-07T15:30:00.000Z',
      updatedAt: '2026-04-07T15:30:00.000Z',
    });

    await Promise.resolve();

    const refreshCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(refreshCoursesRequest.request.method).toBe('GET');
    refreshCoursesRequest.flush([]);

    const createdTeacher = await createPromise;
    expect(createdTeacher.employeeNo).toBe('T39999');
    expect(createdTeacher.expertise).toEqual(['课程建设', '教学评估']);

    await expectAsync(service.createTeacher(payload)).toBeRejectedWithError('教师工号已存在，请使用唯一工号');
  });

  it('should update teacher status and load', async () => {
    const targetTeacher = service.teachers()[0];
    const updatePromise = service.updateTeacher(targetTeacher.id, {
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

    const updateRequest = httpTesting.expectOne(`${teachersUrl}/${targetTeacher.id}`);
    expect(updateRequest.request.method).toBe('PUT');
    updateRequest.flush({
      ...targetTeacher,
      currentWeeklyHours: targetTeacher.maxWeeklyHours + 2,
      status: 'pending',
      active: false,
      updatedAt: '2026-04-07T15:35:00.000Z',
    });

    await Promise.resolve();

    const refreshCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(refreshCoursesRequest.request.method).toBe('GET');
    refreshCoursesRequest.flush([]);

    const updatedTeacher = await updatePromise;

    expect(updatedTeacher.status).toBe('pending');
    expect(updatedTeacher.active).toBeFalse();
    expect(updatedTeacher.currentWeeklyHours).toBe(targetTeacher.maxWeeklyHours + 2);
  });

  it('should refresh courses after removing a teacher', async () => {
    const targetTeacher = service.teachers()[0];

    const removePromise = service.removeTeacher(targetTeacher.id);
    const removeRequest = httpTesting.expectOne(`${teachersUrl}/${targetTeacher.id}`);
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush(null);

    await Promise.resolve();

    const refreshCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(refreshCoursesRequest.request.method).toBe('GET');
    refreshCoursesRequest.flush([]);

    await removePromise;
    expect(service.getTeacherById(targetTeacher.id)).toBeUndefined();
  });
});

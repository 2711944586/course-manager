import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { buildApiUrl } from '../config/api.config';
import { CourseStoreService } from './course-store.service';
import { EnrollmentStoreService } from './enrollment-store.service';
import { StudentStoreService } from './student-store.service';

describe('EnrollmentStoreService', () => {
  const enrollmentStorageKey = 'aurora.course-manager.enrollments';
  const courseStorageKey = 'aurora.course-manager.courses';
  const studentStorageKey = 'aurora.course-manager.students';
  const activityStorageKey = 'aurora.course-manager.activity-log';
  const coursesUrl = buildApiUrl('/courses');
  const studentsUrl = buildApiUrl('/students');
  const enrollmentsUrl = buildApiUrl('/enrollments');

  let service: EnrollmentStoreService;
  let courseStore: CourseStoreService;
  let studentStore: StudentStoreService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(enrollmentStorageKey);
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
    localStorage.removeItem(activityStorageKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EnrollmentStoreService);
    courseStore = TestBed.inject(CourseStoreService);
    studentStore = TestBed.inject(StudentStoreService);
    httpTesting = TestBed.inject(HttpTestingController);

    const initialCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(initialCoursesRequest.request.method).toBe('GET');
    initialCoursesRequest.flush([...courseStore.courses()]);

    const initialStudentsRequest = httpTesting.expectOne(studentsUrl);
    expect(initialStudentsRequest.request.method).toBe('GET');
    initialStudentsRequest.flush([...studentStore.students()]);

    const initialEnrollmentsRequest = httpTesting.expectOne(enrollmentsUrl);
    expect(initialEnrollmentsRequest.request.method).toBe('GET');
    initialEnrollmentsRequest.flush([...service.enrollments()]);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(enrollmentStorageKey);
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
    localStorage.removeItem(activityStorageKey);
  });

  it('should generate workflow-based seed enrollments when storage is empty', () => {
    const enrollments = service.enrollments();

    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0]?.workflowStatus).toBeDefined();
    expect(Array.isArray(enrollments[0]?.riskFlags)).toBeTrue();
  });

  it('should create urgent enrollment when score is below threshold', async () => {
    const student = studentStore.students()[10];
    const course = courseStore.courses()[5];

    const createPromise = service.createEnrollment({
      studentId: student.id,
      courseId: course.id,
      score: 52,
      status: 'enrolled',
      workflowStatus: 'pending-review',
      operator: '测试审核台',
      decisionReason: '低分跟进',
    });

    const createRequest = httpTesting.expectOne(enrollmentsUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: 10_001,
      studentId: student.id,
      courseId: course.id,
      score: 52,
      grade: 'F',
      status: 'enrolled',
      workflowStatus: 'pending-review',
      priority: 'urgent',
      operator: '测试审核台',
      decisionReason: '低分跟进',
      decisionAt: null,
      slaDeadline: '2026-04-09T15:40:00.000Z',
      riskFlags: ['成绩预警'],
      enrollDate: '2026-04-07T15:40:00.000Z',
      updatedAt: '2026-04-07T15:40:00.000Z',
    });

    await Promise.resolve();

    const refreshCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(refreshCoursesRequest.request.method).toBe('GET');
    refreshCoursesRequest.flush([...courseStore.courses()]);

    const createdEnrollment = await createPromise;

    expect(createdEnrollment.grade).toBe('F');
    expect(createdEnrollment.priority).toBe('urgent');
    expect(createdEnrollment.riskFlags).toContain('成绩预警');
  });

  it('should reject duplicate student-course enrollment pair', async () => {
    const existingEnrollment = service.enrollments()[0];

    await expectAsync(
      service.createEnrollment({
        studentId: existingEnrollment.studentId,
        courseId: existingEnrollment.courseId,
        score: 88,
        status: 'completed',
      }),
    ).toBeRejectedWithError('该学生已存在相同课程的选课记录');
  });
});

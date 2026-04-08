import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { buildApiUrl } from '../config/api.config';
import { CourseStoreService } from './course-store.service';
import { InsightEngineService } from './insight-engine.service';
import { StudentStoreService } from './student-store.service';

describe('InsightEngineService', () => {
  const courseStorageKey = 'aurora.course-manager.courses';
  const studentStorageKey = 'aurora.course-manager.students';
  const coursesUrl = buildApiUrl('/courses');
  const studentsUrl = buildApiUrl('/students');

  let service: InsightEngineService;
  let courseStore: CourseStoreService;
  let studentStore: StudentStoreService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InsightEngineService);
    courseStore = TestBed.inject(CourseStoreService);
    studentStore = TestBed.inject(StudentStoreService);
    httpTesting = TestBed.inject(HttpTestingController);

    const initialCoursesRequest = httpTesting.expectOne(coursesUrl);
    expect(initialCoursesRequest.request.method).toBe('GET');
    initialCoursesRequest.flush([...courseStore.courses()]);

    const initialStudentsRequest = httpTesting.expectOne(studentsUrl);
    expect(initialStudentsRequest.request.method).toBe('GET');
    initialStudentsRequest.flush([...studentStore.students()]);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
  });

  it('should build snapshot metrics from stores', () => {
    const snapshot = service.snapshot();

    expect(snapshot.totalCourses).toBeGreaterThan(0);
    expect(snapshot.totalStudents).toBeGreaterThan(0);
    expect(snapshot.trends.length).toBeGreaterThan(0);
    expect(service.missionSummary().length).toBeGreaterThan(0);
  });

  it('should surface critical course and student risks after data changes', async () => {
    const createCoursePromise = courseStore.createCourse({
      name: '高风险课程',
      instructor: '王教授',
      schedule: '周一 / 周三 09:00 - 10:30',
      description: '用于验证洞察引擎的高风险课程识别能力。',
      progress: 5,
      students: 180,
      status: 'active',
      icon: 'warning',
    });

    const createCourseRequest = httpTesting.expectOne(coursesUrl);
    expect(createCourseRequest.request.method).toBe('POST');
    createCourseRequest.flush({
      id: 10_001,
      name: '高风险课程',
      instructor: '王教授',
      schedule: '周一 / 周三 09:00 - 10:30',
      description: '用于验证洞察引擎的高风险课程识别能力。',
      progress: 5,
      students: 180,
      status: 'active',
      icon: 'warning',
      updatedAt: '2026-04-07T15:50:00.000Z',
    });
    await createCoursePromise;

    const createStudentPromise = studentStore.createStudent({
      name: '风险学生',
      studentNo: '20269998',
      gender: 'male',
      birthDate: '2005-06-18',
      score: 35,
    });

    const createStudentRequest = httpTesting.expectOne(studentsUrl);
    expect(createStudentRequest.request.method).toBe('POST');
    createStudentRequest.flush({
      id: 10_001,
      name: '风险学生',
      studentNo: '20269998',
      gender: 'male',
      classId: 'CS2021',
      birthDate: '2005-06-18',
      score: 35,
      updatedAt: '2026-04-07T15:52:00.000Z',
    });
    await createStudentPromise;

    const snapshot = service.snapshot();

    expect(snapshot.highRiskCourses.some(item => item.title === '高风险课程')).toBeTrue();
    expect(snapshot.highRiskStudents.some(item => item.title === '风险学生')).toBeTrue();
  });
});

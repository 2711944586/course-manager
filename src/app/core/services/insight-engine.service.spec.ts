import { TestBed } from '@angular/core/testing';
import { CourseStoreService } from './course-store.service';
import { InsightEngineService } from './insight-engine.service';
import { StudentStoreService } from './student-store.service';

describe('InsightEngineService', () => {
  const courseStorageKey = 'aurora.course-manager.courses';
  const studentStorageKey = 'aurora.course-manager.students';

  let service: InsightEngineService;
  let courseStore: CourseStoreService;
  let studentStore: StudentStoreService;

  beforeEach(() => {
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(InsightEngineService);
    courseStore = TestBed.inject(CourseStoreService);
    studentStore = TestBed.inject(StudentStoreService);
  });

  afterEach(() => {
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

  it('should surface critical course and student risks after data changes', () => {
    courseStore.createCourse({
      name: '高风险课程',
      instructor: '王教授',
      schedule: '周一 / 周三 09:00 - 10:30',
      description: '用于验证洞察引擎的高风险课程识别能力。',
      progress: 5,
      students: 180,
      status: 'active',
      icon: 'warning',
    });

    studentStore.createStudent({
      name: '风险学生',
      studentNo: '20269998',
      gender: 'male',
      birthDate: '2005-06-18',
      score: 35,
    });

    const snapshot = service.snapshot();

    expect(snapshot.highRiskCourses.some(item => item.title === '高风险课程')).toBeTrue();
    expect(snapshot.highRiskStudents.some(item => item.title === '风险学生')).toBeTrue();
  });
});

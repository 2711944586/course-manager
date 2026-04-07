import { TestBed } from '@angular/core/testing';
import { CourseStoreService } from './course-store.service';
import { EnrollmentStoreService } from './enrollment-store.service';
import { StudentStoreService } from './student-store.service';

describe('EnrollmentStoreService', () => {
  const enrollmentStorageKey = 'aurora.course-manager.enrollments';
  const courseStorageKey = 'aurora.course-manager.courses';
  const studentStorageKey = 'aurora.course-manager.students';
  const activityStorageKey = 'aurora.course-manager.activity-log';

  let service: EnrollmentStoreService;
  let courseStore: CourseStoreService;
  let studentStore: StudentStoreService;

  beforeEach(() => {
    localStorage.removeItem(enrollmentStorageKey);
    localStorage.removeItem(courseStorageKey);
    localStorage.removeItem(studentStorageKey);
    localStorage.removeItem(activityStorageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnrollmentStoreService);
    courseStore = TestBed.inject(CourseStoreService);
    studentStore = TestBed.inject(StudentStoreService);
  });

  afterEach(() => {
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

  it('should create urgent enrollment when score is below threshold', () => {
    const student = studentStore.students()[10];
    const course = courseStore.courses()[5];

    const createdEnrollment = service.createEnrollment({
      studentId: student.id,
      courseId: course.id,
      score: 52,
      status: 'enrolled',
      workflowStatus: 'pending-review',
      operator: '测试审核台',
      decisionReason: '低分跟进',
    });

    expect(createdEnrollment.grade).toBe('F');
    expect(createdEnrollment.priority).toBe('urgent');
    expect(createdEnrollment.riskFlags).toContain('成绩预警');
  });

  it('should reject duplicate student-course enrollment pair', () => {
    const existingEnrollment = service.enrollments()[0];

    expect(() =>
      service.createEnrollment({
        studentId: existingEnrollment.studentId,
        courseId: existingEnrollment.courseId,
        score: 88,
        status: 'completed',
      }),
    ).toThrowError('该学生已存在相同课程的选课记录');
  });
});

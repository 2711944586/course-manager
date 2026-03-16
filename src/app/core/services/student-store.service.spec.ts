import { TestBed } from '@angular/core/testing';
import { StudentUpsertInput } from '../models/student.model';
import { StudentStoreService } from './student-store.service';

describe('StudentStoreService', () => {
  const storageKey = 'aurora.course-manager.students';

  let service: StudentStoreService;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentStoreService);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should generate fake students when storage is empty', () => {
    const students = service.students();

    expect(students.length).toBe(120);
    expect(students[0]?.name.length).toBeGreaterThan(1);
    expect(students[0]?.studentNo).toMatch(/^\d{8}$/);
  });

  it('should create a student and keep studentNo unique', () => {
    const payload: StudentUpsertInput = {
      name: '测试同学',
      studentNo: '20269999',
      gender: 'male',
      birthDate: '2005-06-18',
      score: 85,
    };

    const createdStudent = service.createStudent(payload);
    expect(createdStudent.studentNo).toBe('20269999');

    expect(() => service.createStudent(payload)).toThrowError('学号已存在，请使用唯一学号');
  });

  it('should regenerate fake students with target count', () => {
    const students = service.regenerateFakeStudents(50);
    expect(students.length).toBe(50);
    expect(service.students().length).toBe(50);
  });

  it('should reject invalid birthDate input', () => {
    const invalidPayload: StudentUpsertInput = {
      name: '非法日期',
      studentNo: '20268888',
      gender: 'female',
      birthDate: '2099-01-01',
      score: 70,
    };

    expect(() => service.createStudent(invalidPayload)).toThrowError('出生日期不能晚于今天');
  });
});

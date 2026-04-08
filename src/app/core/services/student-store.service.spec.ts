import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { buildApiUrl } from '../config/api.config';
import { StudentUpsertInput } from '../models/student.model';
import { StudentStoreService } from './student-store.service';

describe('StudentStoreService', () => {
  const storageKey = 'aurora.course-manager.students';
  const studentsUrl = buildApiUrl('/students');

  let service: StudentStoreService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StudentStoreService);
    httpTesting = TestBed.inject(HttpTestingController);

    const initialRequest = httpTesting.expectOne(studentsUrl);
    expect(initialRequest.request.method).toBe('GET');
    initialRequest.flush([...service.students()]);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(storageKey);
  });

  it('should generate fake students when storage is empty', () => {
    const students = service.students();

    expect(students.length).toBe(120);
    expect(students[0]?.name.length).toBeGreaterThan(1);
    expect(students[0]?.studentNo).toMatch(/^\d{8}$/);
  });

  it('should create a student and keep studentNo unique', async () => {
    const payload: StudentUpsertInput = {
      name: '测试同学',
      studentNo: '20269999',
      gender: 'male',
      birthDate: '2005-06-18',
      score: 85,
    };

    const createPromise = service.createStudent(payload);
    const createRequest = httpTesting.expectOne(studentsUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({
      id: 10_001,
      ...payload,
      classId: 'CS2021',
      updatedAt: '2026-04-07T15:20:00.000Z',
    });

    const createdStudent = await createPromise;
    expect(createdStudent.studentNo).toBe('20269999');

    await expectAsync(service.createStudent(payload)).toBeRejectedWithError('学号已存在，请使用唯一学号');
  });

  it('should regenerate fake students with target count', () => {
    const students = service.regenerateFakeStudents(50);
    expect(students.length).toBe(50);
    expect(service.students().length).toBe(50);
  });

  it('should reject invalid birthDate input', async () => {
    const invalidPayload: StudentUpsertInput = {
      name: '非法日期',
      studentNo: '20268888',
      gender: 'female',
      birthDate: '2099-01-01',
      score: 70,
    };

    await expectAsync(service.createStudent(invalidPayload)).toBeRejectedWithError('出生日期不能晚于今天');
  });
});

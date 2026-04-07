import { Injectable, computed, signal } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { Student, StudentGender, StudentUpsertInput } from '../models/student.model';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.students';
const DEFAULT_FAKE_COUNT = 120;
const MIN_NAME_LENGTH = 2;
const STUDENT_NO_REGEX = /^\d{8,12}$/;
const EARLIEST_BIRTH_DATE = '1980-01-01';
const DEFAULT_CLASS_IDS = ['CS2021', 'SE2021', 'AI2021', 'NET2021', 'DS2021', 'BUS2021'] as const;

export interface StudentLoadOptions {
  readonly delayMs?: number;
  readonly shouldFail?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudentStoreService {
  private readonly studentState = signal<readonly Student[]>(this.loadStudents());

  readonly students = computed(() => this.studentState());

  loadStudents$(options: StudentLoadOptions = {}): Observable<readonly Student[]> {
    const normalizedDelay = Math.max(120, Math.min(3000, Math.round(options.delayMs ?? 900)));
    const shouldFail = options.shouldFail ?? false;

    return timer(normalizedDelay).pipe(
      map(() => {
        if (shouldFail) {
          throw new Error('学生数据加载失败，请检查网络后重试。');
        }

        return [...this.studentState()];
      }),
    );
  }

  getStudentById(studentId: number): Student | undefined {
    return this.studentState().find(student => student.id === studentId);
  }

  createStudent(input: StudentUpsertInput): Student {
    const normalizedInput = this.normalizeInput(input);
    this.ensureStudentNoUnique(normalizedInput.studentNo);

    const createdStudent: Student = {
      id: this.getNextStudentId(),
      updatedAt: new Date().toISOString(),
      ...normalizedInput,
    };

    this.writeStudents([createdStudent, ...this.studentState()]);
    return createdStudent;
  }

  updateStudent(studentId: number, input: StudentUpsertInput): Student {
    const existingStudent = this.getStudentById(studentId);
    if (!existingStudent) {
      throw new Error('学生不存在，无法更新');
    }

    const normalizedInput = this.normalizeInput(input, existingStudent.classId);
    this.ensureStudentNoUnique(normalizedInput.studentNo, studentId);

    const updatedStudent: Student = {
      ...existingStudent,
      ...normalizedInput,
      updatedAt: new Date().toISOString(),
    };

    const nextStudents = this.studentState().map(student =>
      student.id === studentId ? updatedStudent : student,
    );

    this.writeStudents(nextStudents);
    return updatedStudent;
  }

  removeStudent(studentId: number): void {
    const nextStudents = this.studentState().filter(student => student.id !== studentId);
    if (nextStudents.length === this.studentState().length) {
      throw new Error('学生不存在，无法删除');
    }

    this.writeStudents(nextStudents);
  }

  removeMany(ids: readonly number[]): number {
    const idSet = new Set(ids);
    const before = this.studentState();
    const after = before.filter(s => !idSet.has(s.id));
    const removed = before.length - after.length;
    if (removed > 0) {
      this.writeStudents(after);
    }
    return removed;
  }

  regenerateFakeStudents(count = DEFAULT_FAKE_COUNT): readonly Student[] {
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error('生成数量必须大于 0');
    }

    const normalizedCount = Math.min(Math.round(count), 500);
    const nextStudents = this.generateFakeStudents(normalizedCount);
    this.writeStudents(nextStudents);
    return nextStudents;
  }

  private writeStudents(students: readonly Student[]): void {
    this.studentState.set(students);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(students));
  }

  private loadStudents(): readonly Student[] {
    const rawData = safeStorageGetItem(STORAGE_KEY);
    if (!rawData) {
      return this.generateFakeStudents(DEFAULT_FAKE_COUNT);
    }

    try {
      const parsedData = JSON.parse(rawData) as unknown;
      if (Array.isArray(parsedData)) {
        const validStudents = parsedData.filter(item => this.isStudent(item));
        if (validStudents.length > 0) {
          return this.withDefaultClassIds(validStudents);
        }
      }
    } catch {
      return this.generateFakeStudents(DEFAULT_FAKE_COUNT);
    }

    return this.generateFakeStudents(DEFAULT_FAKE_COUNT);
  }

  private getNextStudentId(): number {
    return this.studentState().reduce((maxId, student) => Math.max(maxId, student.id), 0) + 1;
  }

  private normalizeInput(
    input: StudentUpsertInput,
    fallbackClassId: string | null = DEFAULT_CLASS_IDS[0],
  ): Omit<Student, 'id' | 'updatedAt'> {
    const normalizedName = input.name.trim();
    const normalizedStudentNo = input.studentNo.trim();

    if (normalizedName.length < MIN_NAME_LENGTH) {
      throw new Error('学生姓名至少需要 2 个字符');
    }

    if (!STUDENT_NO_REGEX.test(normalizedStudentNo)) {
      throw new Error('学号格式不正确，应为 8-12 位数字');
    }

    const normalizedBirthDate = this.normalizeBirthDate(input.birthDate);
    const normalizedScore = this.normalizeScore(input.score);

    return {
      name: normalizedName,
      studentNo: normalizedStudentNo,
      gender: input.gender,
      classId: input.classId?.trim() || fallbackClassId,
      birthDate: normalizedBirthDate,
      score: normalizedScore,
    };
  }

  private normalizeScore(score: number): number {
    const rounded = Math.round(score);
    if (!Number.isFinite(rounded) || rounded < 0 || rounded > 100) {
      throw new Error('成绩必须在 0 到 100 之间');
    }
    return rounded;
  }

  private normalizeBirthDate(birthDate: string): string {
    const normalizedDate = birthDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      throw new Error('出生日期格式不正确');
    }

    const dateObject = new Date(`${normalizedDate}T00:00:00`);
    if (Number.isNaN(dateObject.getTime())) {
      throw new Error('出生日期无效');
    }

    const today = new Date();
    const earliestDate = new Date(`${EARLIEST_BIRTH_DATE}T00:00:00`);

    if (dateObject > today) {
      throw new Error('出生日期不能晚于今天');
    }

    if (dateObject < earliestDate) {
      throw new Error('出生日期超出允许范围');
    }

    return normalizedDate;
  }

  private ensureStudentNoUnique(studentNo: string, currentStudentId?: number): void {
    const duplicatedStudent = this.studentState().find(
      student => student.studentNo === studentNo && student.id !== currentStudentId,
    );

    if (duplicatedStudent) {
      throw new Error('学号已存在，请使用唯一学号');
    }
  }

  private generateFakeStudents(count: number): readonly Student[] {
    const random = this.createRandom(20260313);
    const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
    const maleGivenNames = ['浩然', '宇轩', '子昂', '明哲', '嘉豪', '俊杰', '博文', '梓豪', '启航', '修远', '承泽', '煜城'];
    const femaleGivenNames = ['雨桐', '若曦', '诗涵', '梦瑶', '语嫣', '嘉怡', '思妍', '梓萱', '可欣', '欣怡', '清妍', '雅宁'];

    const fakeStudents: Student[] = [];

    for (let index = 0; index < count; index += 1) {
      const gender: StudentGender = random() > 0.52 ? 'male' : 'female';
      const givenNames = gender === 'male' ? maleGivenNames : femaleGivenNames;
      const surname = surnames[Math.floor(random() * surnames.length)] ?? '王';
      const givenName = givenNames[Math.floor(random() * givenNames.length)] ?? '同学';
      const studentNo = `2026${String(index + 1).padStart(4, '0')}`;
      const birthDate = this.createFakeBirthDate(random);
      const updatedAt = this.createFakeUpdatedAt(random);
      const score = this.createFakeScore(random);

      fakeStudents.push({
        id: index + 1,
        name: `${surname}${givenName}`,
        studentNo,
        gender,
        classId: DEFAULT_CLASS_IDS[index % DEFAULT_CLASS_IDS.length],
        birthDate,
        score,
        updatedAt,
      });
    }

    return fakeStudents;
  }

  private createFakeBirthDate(random: () => number): string {
    const startDate = new Date('2001-01-01T00:00:00');
    const endDate = new Date('2008-12-31T00:00:00');
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000));
    const offsetDays = Math.floor(random() * totalDays);
    const targetDate = new Date(startDate.getTime() + offsetDays * 24 * 3600 * 1000);

    return this.formatDate(targetDate);
  }

  private createFakeUpdatedAt(random: () => number): string {
    const now = Date.now();
    const maxOffset = 1000 * 60 * 60 * 24 * 30;
    const offset = Math.floor(random() * maxOffset);
    return new Date(now - offset).toISOString();
  }

  private createFakeScore(random: () => number): number {
    const base = random();
    if (base < 0.05) return Math.floor(random() * 30) + 10;
    if (base < 0.15) return Math.floor(random() * 10) + 50;
    if (base < 0.35) return Math.floor(random() * 10) + 60;
    if (base < 0.60) return Math.floor(random() * 10) + 70;
    if (base < 0.85) return Math.floor(random() * 10) + 80;
    return Math.floor(random() * 10) + 90;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  private isStudent(candidate: unknown): candidate is Student {
    if (!candidate || typeof candidate !== 'object') {
      return false;
    }

    const typedStudent = candidate as Partial<Student>;
    const isValidGender = typedStudent.gender === 'male' || typedStudent.gender === 'female';
    const isValidClassId =
      typedStudent.classId === undefined ||
      typedStudent.classId === null ||
      typeof typedStudent.classId === 'string';

    return (
      typeof typedStudent.id === 'number' &&
      typeof typedStudent.name === 'string' &&
      typeof typedStudent.studentNo === 'string' &&
      typeof typedStudent.birthDate === 'string' &&
      typeof typedStudent.updatedAt === 'string' &&
      typeof typedStudent.score === 'number' &&
      isValidClassId &&
      isValidGender
    );
  }

  importAll(students: unknown[]): number {
    const valid = students.filter((item): item is Student => this.isStudent(item));
    if (valid.length > 0) {
      this.writeStudents(this.withDefaultClassIds(valid));
    }
    return valid.length;
  }

  private withDefaultClassIds(students: readonly Student[]): readonly Student[] {
    return students.map((student, index) => ({
      ...student,
      classId: student.classId?.trim() || DEFAULT_CLASS_IDS[index % DEFAULT_CLASS_IDS.length],
    }));
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { Teacher, TeacherUpsertInput } from '../models/teacher.model';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.teachers';
const DEFAULT_FAKE_COUNT = 15;

@Injectable({ providedIn: 'root' })
export class TeacherStoreService {
  private readonly teacherState = signal<readonly Teacher[]>(this.loadTeachers());

  readonly teachers = computed(() => this.teacherState());

  getTeacherById(teacherId: number): Teacher | undefined {
    return this.teacherState().find(teacher => teacher.id === teacherId);
  }

  createTeacher(input: TeacherUpsertInput): Teacher {
    const createdTeacher: Teacher = {
      id: this.getNextTeacherId(),
      updatedAt: new Date().toISOString(),
      ...input,
    };

    this.writeTeachers([createdTeacher, ...this.teacherState()]);
    return createdTeacher;
  }

  updateTeacher(teacherId: number, input: TeacherUpsertInput): Teacher {
    const existingTeacher = this.getTeacherById(teacherId);
    if (!existingTeacher) {
      throw new Error('Teacher not found');
    }

    const updatedTeacher: Teacher = {
      ...existingTeacher,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const nextTeachers = this.teacherState().map(teacher =>
      teacher.id === teacherId ? updatedTeacher : teacher,
    );

    this.writeTeachers(nextTeachers);
    return updatedTeacher;
  }

  removeTeacher(teacherId: number): void {
    const nextTeachers = this.teacherState().filter(teacher => teacher.id !== teacherId);
    this.writeTeachers(nextTeachers);
  }

  private writeTeachers(teachers: readonly Teacher[]): void {
    this.teacherState.set(teachers);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(teachers));
  }

  private loadTeachers(): readonly Teacher[] {
    const rawData = safeStorageGetItem(STORAGE_KEY);
    if (!rawData) {
      return this.generateFakeTeachers(DEFAULT_FAKE_COUNT);
    }

    try {
      const parsed: unknown = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(
          (item): item is Teacher =>
            typeof item === 'object' && item !== null &&
            typeof item.id === 'number' && typeof item.name === 'string' &&
            typeof item.department === 'string'
        );
      }
    } catch {
      return this.generateFakeTeachers(DEFAULT_FAKE_COUNT);
    }
    return this.generateFakeTeachers(DEFAULT_FAKE_COUNT);
  }

  private getNextTeacherId(): number {
    return this.teacherState().reduce((maxId, teacher) => Math.max(maxId, teacher.id), 0) + 1;
  }

  private generateFakeTeachers(count: number): readonly Teacher[] {
    const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
    const givenNames = ['建国', '伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳'];
    const titles = ['教授', '副教授', '讲师', '助教'];
    const departments = ['计算机学院', '数学学院', '物理学院', '外语学院', '商学院'];

    const fakeTeachers: Teacher[] = [];

    for (let index = 0; index < count; index += 1) {
      const surname = surnames[index % surnames.length];
      const givenName = givenNames[(index * 2) % givenNames.length];
      
      fakeTeachers.push({
        id: index + 1,
        name: `${surname}${givenName}`,
        title: titles[index % titles.length],
        department: departments[index % departments.length],
        email: `teacher${index + 1}@university.edu.cn`,
        active: true,
        updatedAt: new Date().toISOString(),
      });
    }

    return fakeTeachers;
  }
}

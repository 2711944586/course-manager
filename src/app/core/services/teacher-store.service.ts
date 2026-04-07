import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivityLogService } from './activity-log.service';
import { Teacher, TeacherStatus, TeacherUpsertInput } from '../models/teacher.model';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.teachers';
const DEFAULT_FAKE_COUNT = 15;
const MIN_NAME_LENGTH = 2;
const EMPLOYEE_NO_REGEX = /^T\d{5,}$/;

@Injectable({ providedIn: 'root' })
export class TeacherStoreService {
  private readonly activityLog = inject(ActivityLogService);
  private readonly teacherState = signal<readonly Teacher[]>(this.loadTeachers());

  readonly teachers = computed(() => this.teacherState());

  getTeacherById(teacherId: number): Teacher | undefined {
    return this.teacherState().find(teacher => teacher.id === teacherId);
  }

  createTeacher(input: TeacherUpsertInput): Teacher {
    const normalizedInput = this.normalizeInput(input);
    this.ensureEmployeeNoUnique(normalizedInput.employeeNo);

    const createdTeacher: Teacher = {
      id: this.getNextTeacherId(),
      updatedAt: new Date().toISOString(),
      lastReviewAt: new Date().toISOString(),
      ...normalizedInput,
    };

    this.writeTeachers([createdTeacher, ...this.teacherState()]);
    this.activityLog.log('create', 'teacher', createdTeacher.name, `新增教师档案：${createdTeacher.employeeNo}`);
    return createdTeacher;
  }

  updateTeacher(teacherId: number, input: TeacherUpsertInput): Teacher {
    const existingTeacher = this.getTeacherById(teacherId);
    if (!existingTeacher) {
      throw new Error('教师不存在，无法更新');
    }

    const normalizedInput = this.normalizeInput(input);
    this.ensureEmployeeNoUnique(normalizedInput.employeeNo, teacherId);

    const updatedTeacher: Teacher = {
      ...existingTeacher,
      ...normalizedInput,
      lastReviewAt:
        normalizedInput.status === 'active' || normalizedInput.currentWeeklyHours !== existingTeacher.currentWeeklyHours
          ? new Date().toISOString()
          : existingTeacher.lastReviewAt,
      updatedAt: new Date().toISOString(),
    };

    const nextTeachers = this.teacherState().map(teacher =>
      teacher.id === teacherId ? updatedTeacher : teacher,
    );

    this.writeTeachers(nextTeachers);
    this.activityLog.log('update', 'teacher', updatedTeacher.name, `更新教师档案：${updatedTeacher.employeeNo}`);
    return updatedTeacher;
  }

  removeTeacher(teacherId: number): void {
    const targetTeacher = this.getTeacherById(teacherId);
    if (!targetTeacher) {
      throw new Error('教师不存在，无法删除');
    }

    const nextTeachers = this.teacherState().filter(teacher => teacher.id !== teacherId);
    this.writeTeachers(nextTeachers);
    this.activityLog.log('delete', 'teacher', targetTeacher.name, `删除教师档案：${targetTeacher.employeeNo}`);
  }

  regenerateFakeTeachers(count = DEFAULT_FAKE_COUNT): readonly Teacher[] {
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error('生成数量必须大于 0');
    }

    const nextTeachers = this.generateFakeTeachers(Math.min(Math.round(count), 120));
    this.writeTeachers(nextTeachers);
    return nextTeachers;
  }

  importAll(teachers: unknown[]): number {
    const validTeachers = teachers
      .map((item, index) => this.hydrateTeacher(item, index))
      .filter((item): item is Teacher => item !== null);

    if (validTeachers.length > 0) {
      this.writeTeachers(validTeachers);
    }

    return validTeachers.length;
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
        const validTeachers = parsed
          .map((item, index) => this.hydrateTeacher(item, index))
          .filter((item): item is Teacher => item !== null);

        if (validTeachers.length > 0) {
          return validTeachers;
        }
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
    const random = this.createRandom(20260321);
    const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '宋', '邓', '许'];
    const givenNames = ['建国', '伟', '娜', '敏', '静', '强', '磊', '洋', '雅宁', '思源', '知行', '嘉树'];
    const titles = ['教授', '副教授', '讲师', '助教'];
    const departments = ['计算机学院', '数学学院', '物理学院', '外语学院', '商学院', '经济学院'];
    const offices = ['博学楼 A-302', '明理楼 B-418', '信息楼 C-512', '求真楼 A-209', '经管楼 D-608'];
    const expertiseOptions = [
      ['课程规划', '学业督导'],
      ['数据分析', '教学评估'],
      ['科研项目', '实践指导'],
      ['学生辅导', '资源协调'],
      ['课程建设', '质量审查'],
    ] as const;

    const fakeTeachers: Teacher[] = [];

    for (let index = 0; index < count; index += 1) {
      const surname = surnames[index % surnames.length];
      const givenName = givenNames[(index * 3) % givenNames.length];
      const title = titles[index % titles.length];
      const status = this.resolveStatus(index);
      const maxWeeklyHours = title === '教授' ? 8 : title === '副教授' ? 10 : 12;
      const currentWeeklyHours = Math.min(
        maxWeeklyHours + (index % 6 === 0 ? 2 : 0),
        maxWeeklyHours + 4,
      );
      const reviewDate = new Date(Date.now() - Math.floor(random() * 1000 * 60 * 60 * 24 * 21)).toISOString();

      fakeTeachers.push({
        id: index + 1,
        employeeNo: `T${String(26001 + index).padStart(5, '0')}`,
        name: `${surname}${givenName}`,
        title,
        department: departments[index % departments.length],
        email: `teacher${index + 1}@campus.example.edu.cn`,
        phone: `138${String(10000000 + index * 137).slice(0, 8)}`,
        office: offices[index % offices.length],
        expertise: [...expertiseOptions[index % expertiseOptions.length]],
        maxWeeklyHours,
        currentWeeklyHours,
        status,
        active: status === 'active',
        lastReviewAt: reviewDate,
        updatedAt: reviewDate,
      });
    }

    return fakeTeachers;
  }

  private hydrateTeacher(candidate: unknown, index: number): Teacher | null {
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    const rawTeacher = candidate as Partial<Teacher>;
    if (typeof rawTeacher.id !== 'number' || typeof rawTeacher.name !== 'string') {
      return null;
    }

    const status = this.normalizeStatus(rawTeacher.status, rawTeacher.active);
    const title = typeof rawTeacher.title === 'string' && rawTeacher.title ? rawTeacher.title : '讲师';
    const department = typeof rawTeacher.department === 'string' && rawTeacher.department ? rawTeacher.department : '未分配院系';
    const updatedAt = typeof rawTeacher.updatedAt === 'string' ? rawTeacher.updatedAt : new Date().toISOString();

    return {
      id: rawTeacher.id,
      employeeNo:
        typeof rawTeacher.employeeNo === 'string' && rawTeacher.employeeNo
          ? rawTeacher.employeeNo
          : `T${String(28001 + index).padStart(5, '0')}`,
      name: rawTeacher.name,
      title,
      department,
      email:
        typeof rawTeacher.email === 'string' && rawTeacher.email
          ? rawTeacher.email
          : `teacher${rawTeacher.id}@campus.example.edu.cn`,
      phone: typeof rawTeacher.phone === 'string' && rawTeacher.phone ? rawTeacher.phone : '',
      office: typeof rawTeacher.office === 'string' && rawTeacher.office ? rawTeacher.office : '待分配工位',
      expertise:
        Array.isArray(rawTeacher.expertise) && rawTeacher.expertise.length > 0
          ? rawTeacher.expertise.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : ['课程建设'],
      maxWeeklyHours:
        typeof rawTeacher.maxWeeklyHours === 'number' && Number.isFinite(rawTeacher.maxWeeklyHours)
          ? Math.max(4, Math.round(rawTeacher.maxWeeklyHours))
          : 12,
      currentWeeklyHours:
        typeof rawTeacher.currentWeeklyHours === 'number' && Number.isFinite(rawTeacher.currentWeeklyHours)
          ? Math.max(0, Math.round(rawTeacher.currentWeeklyHours))
          : 6,
      status,
      active: status === 'active',
      lastReviewAt: typeof rawTeacher.lastReviewAt === 'string' ? rawTeacher.lastReviewAt : updatedAt,
      updatedAt,
    };
  }

  private normalizeInput(input: TeacherUpsertInput): Omit<Teacher, 'id' | 'updatedAt' | 'lastReviewAt'> {
    const name = input.name.trim();
    const employeeNo = input.employeeNo.trim().toUpperCase();
    const department = input.department.trim();
    const email = input.email.trim().toLowerCase();

    if (name.length < MIN_NAME_LENGTH) {
      throw new Error('教师姓名至少需要 2 个字符');
    }

    if (!EMPLOYEE_NO_REGEX.test(employeeNo)) {
      throw new Error('工号格式不正确，应以 T 开头并包含至少 5 位数字');
    }

    if (!department) {
      throw new Error('所属院系不能为空');
    }

    if (!email.includes('@')) {
      throw new Error('工作邮箱格式不正确');
    }

    const maxWeeklyHours = this.normalizeHours(input.maxWeeklyHours, '每周容量');
    const currentWeeklyHours = this.normalizeHours(input.currentWeeklyHours, '当前负荷');

    return {
      employeeNo,
      name,
      title: input.title.trim() || '讲师',
      department,
      email,
      phone: input.phone.trim(),
      office: input.office.trim() || '待分配工位',
      expertise: input.expertise
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .slice(0, 6),
      maxWeeklyHours,
      currentWeeklyHours,
      status: this.normalizeStatus(input.status, input.active),
      active: this.normalizeStatus(input.status, input.active) === 'active',
    };
  }

  private normalizeHours(value: number, label: string): number {
    if (!Number.isFinite(value)) {
      throw new Error(`${label}必须是有效数字`);
    }

    const rounded = Math.round(value);
    if (rounded < 0 || rounded > 30) {
      throw new Error(`${label}需在 0 到 30 之间`);
    }

    return rounded;
  }

  private ensureEmployeeNoUnique(employeeNo: string, currentTeacherId?: number): void {
    const duplicatedTeacher = this.teacherState().find(
      teacher => teacher.employeeNo === employeeNo && teacher.id !== currentTeacherId,
    );

    if (duplicatedTeacher) {
      throw new Error('教师工号已存在，请使用唯一工号');
    }
  }

  private normalizeStatus(status: TeacherStatus | undefined, active: boolean | undefined): TeacherStatus {
    if (status === 'active' || status === 'leave' || status === 'pending') {
      return status;
    }

    return active === false ? 'leave' : 'active';
  }

  private resolveStatus(index: number): TeacherStatus {
    if (index % 7 === 0) {
      return 'pending';
    }

    if (index % 5 === 0) {
      return 'leave';
    }

    return 'active';
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
}

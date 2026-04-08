import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ActivityLogService } from './activity-log.service';
import { buildApiUrl } from '../config/api.config';
import {
  Enrollment,
  EnrollmentPriority,
  EnrollmentStatus,
  EnrollmentUpsertInput,
  EnrollmentWorkflowStatus,
} from '../models/enrollment.model';
import { StudentStoreService } from './student-store.service';
import { CourseStoreService } from './course-store.service';
import { extractHttpErrorMessage } from '../utils/http-error.util';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.enrollments';

@Injectable({ providedIn: 'root' })
export class EnrollmentStoreService {
  private readonly http = inject(HttpClient);
  private readonly studentStore = inject(StudentStoreService);
  private readonly courseStore = inject(CourseStoreService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly enrollmentsUrl = buildApiUrl('/enrollments');
  private readonly enrollmentState = signal<readonly Enrollment[]>(this.loadEnrollments());

  readonly enrollments = computed(() => this.enrollmentState());

  constructor() {
    void this.refreshEnrollments();
  }

  async refreshEnrollments(): Promise<readonly Enrollment[]> {
    try {
      const enrollments = await firstValueFrom(this.http.get<readonly Enrollment[]>(this.enrollmentsUrl));
      const normalizedEnrollments = enrollments
        .map(item => this.hydrateEnrollment(item))
        .filter((item): item is Enrollment => item !== null);

      this.writeEnrollments(normalizedEnrollments);

      return normalizedEnrollments;
    } catch (error) {
      if (this.enrollmentState().length > 0) {
        return this.enrollmentState();
      }

      throw new Error(extractHttpErrorMessage(error, '加载选课记录失败'));
    }
  }

  getEnrollmentById(enrollmentId: number): Enrollment | undefined {
    return this.enrollmentState().find(enr => enr.id === enrollmentId);
  }

  getEnrollmentsByStudent(studentId: number): Enrollment[] {
    return this.enrollmentState().filter(enr => enr.studentId === studentId);
  }

  getEnrollmentsByCourse(courseId: number): Enrollment[] {
    return this.enrollmentState().filter(enr => enr.courseId === courseId);
  }

  async createEnrollment(input: EnrollmentUpsertInput): Promise<Enrollment> {
    const student = this.studentStore.getStudentById(input.studentId);
    if (!student) {
      throw new Error('学生不存在，无法创建选课记录');
    }
    const course = this.courseStore.getCourseById(input.courseId);
    if (!course) {
      throw new Error('课程不存在，无法创建选课记录');
    }

    this.ensureEnrollmentUnique(input.studentId, input.courseId);
    const now = new Date();
    const normalizedInput = this.normalizeInput(input, now, course.students);

    const createdEnrollment = await firstValueFrom(
      this.http.post<Enrollment>(this.enrollmentsUrl, normalizedInput),
    );

    this.writeEnrollments([createdEnrollment, ...this.enrollmentState()]);
    await this.courseStore.refreshCourses();
    this.activityLog.log('create', 'enrollment', '选课记录', `${student.name} 选修 ${course.name}`);
    return createdEnrollment;
  }

  async updateEnrollment(enrollmentId: number, input: EnrollmentUpsertInput): Promise<Enrollment> {
    const existingEnrollment = this.getEnrollmentById(enrollmentId);
    if (!existingEnrollment) {
      throw new Error('选课记录不存在，无法更新');
    }

    const student = this.studentStore.getStudentById(input.studentId);
    if (!student) {
      throw new Error('学生不存在，无法更新选课记录');
    }
    const course = this.courseStore.getCourseById(input.courseId);
    if (!course) {
      throw new Error('课程不存在，无法更新选课记录');
    }

    this.ensureEnrollmentUnique(input.studentId, input.courseId, enrollmentId);
    const now = new Date();
    const normalizedInput = this.normalizeInput(input, now, course.students, existingEnrollment);

    const updatedEnrollment = await firstValueFrom(
      this.http.put<Enrollment>(`${this.enrollmentsUrl}/${enrollmentId}`, normalizedInput),
    );

    const nextEnrollments = this.enrollmentState().map(enr =>
      enr.id === enrollmentId ? updatedEnrollment : enr,
    );

    this.writeEnrollments(nextEnrollments);
    await this.courseStore.refreshCourses();
    this.activityLog.log('update', 'enrollment', '选课记录', `${student.name} / ${course.name} 记录已更新`);
    return updatedEnrollment;
  }

  async removeEnrollment(enrollmentId: number): Promise<void> {
    const existingEnrollment = this.getEnrollmentById(enrollmentId);
    if (!existingEnrollment) {
      throw new Error('选课记录不存在，无法删除');
    }

    await firstValueFrom(this.http.delete<void>(`${this.enrollmentsUrl}/${enrollmentId}`));
    const nextEnrollments = this.enrollmentState().filter(enr => enr.id !== enrollmentId);
    this.writeEnrollments(nextEnrollments);
    await this.courseStore.refreshCourses();
    const student = this.studentStore.getStudentById(existingEnrollment.studentId);
    const course = this.courseStore.getCourseById(existingEnrollment.courseId);
    this.activityLog.log(
      'delete',
      'enrollment',
      '选课记录',
      `${student?.name ?? '未知学生'} 退除 ${course?.name ?? '未知课程'} 记录`,
    );
  }

  importAll(enrollments: unknown[]): number {
    const validEnrollments = enrollments
      .map(item => this.hydrateEnrollment(item))
      .filter((item): item is Enrollment => item !== null);

    if (validEnrollments.length > 0) {
      this.writeEnrollments(validEnrollments);
    }

    return validEnrollments.length;
  }

  private calculateGrade(score: number | null): string {
    if (score === null) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private writeEnrollments(enrollments: readonly Enrollment[]): void {
    this.enrollmentState.set(enrollments);
    safeStorageSetItem(STORAGE_KEY, JSON.stringify(enrollments));
  }

  private loadEnrollments(): readonly Enrollment[] {
    const rawData = safeStorageGetItem(STORAGE_KEY);
    if (!rawData) {
      return this.generateFakeEnrollments();
    }

    try {
      const parsed: unknown = JSON.parse(rawData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validEnrollments = parsed
          .map(item => this.hydrateEnrollment(item))
          .filter((item): item is Enrollment => item !== null);

        if (validEnrollments.length > 0) {
          return validEnrollments;
        }
      }
    } catch {
      return this.generateFakeEnrollments();
    }
    return this.generateFakeEnrollments();
  }

  private getNextEnrollmentId(): number {
    return this.enrollmentState().reduce((maxId, enr) => Math.max(maxId, enr.id), 0) + 1;
  }

  private generateFakeEnrollments(): readonly Enrollment[] {
    const students = this.studentStore.students();
    const courses = this.courseStore.courses();
    if (students.length === 0 || courses.length === 0) {
      return [];
    }

    const random = this.createRandom(20260322);
    const operators = ['教务运营台', '院系秘书组', '课程协调员'];
    const pairSet = new Set<string>();
    const fakeEnrollments: Enrollment[] = [];
    const targetCount = Math.min(Math.max(courses.length * 8, 48), students.length * 2, 140);

    for (let index = 0; index < targetCount; index += 1) {
      const student = students[(index * 3) % students.length] ?? students[0];
      const course = courses[(index + Math.floor(random() * courses.length)) % courses.length] ?? courses[0];
      const pairKey = `${student.id}-${course.id}`;

      if (!student || !course || pairSet.has(pairKey)) {
        continue;
      }

      pairSet.add(pairKey);

      const enrolledAt = new Date(Date.now() - Math.floor(random() * 1000 * 60 * 60 * 24 * 35));
      const status = this.resolveSeedStatus(random());
      const score = status === 'completed' ? this.createSeedScore(random) : random() < 0.12 ? this.createSeedScore(random) : null;
      const workflowStatus = this.resolveWorkflowStatus(status, undefined);
      const priority = this.resolvePriority(score, status, workflowStatus, course.students);
      const decisionReason =
        status === 'dropped'
          ? '学生主动调整学习计划'
          : status === 'completed'
            ? '课程成绩与考核记录已归档'
            : '待院系完成容量复核';
      const updatedAt = new Date(enrolledAt.getTime() + Math.floor(random() * 1000 * 60 * 60 * 24 * 6));

      fakeEnrollments.push({
        id: fakeEnrollments.length + 1,
        studentId: student.id,
        courseId: course.id,
        score,
        grade: this.calculateGrade(score),
        status,
        workflowStatus,
        priority,
        operator: operators[index % operators.length],
        decisionReason,
        decisionAt:
          workflowStatus === 'approved' || workflowStatus === 'rejected'
            ? updatedAt.toISOString()
            : null,
        slaDeadline: new Date(enrolledAt.getTime() + this.resolveSlaHours(status) * 60 * 60 * 1000).toISOString(),
        riskFlags: this.buildRiskFlags(score, status, workflowStatus, course.students, enrolledAt),
        enrollDate: enrolledAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    }

    return fakeEnrollments;
  }

  private hydrateEnrollment(candidate: unknown): Enrollment | null {
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    const rawEnrollment = candidate as Partial<Enrollment>;
    if (
      typeof rawEnrollment.id !== 'number' ||
      typeof rawEnrollment.studentId !== 'number' ||
      typeof rawEnrollment.courseId !== 'number'
    ) {
      return null;
    }

    const course = this.courseStore.getCourseById(rawEnrollment.courseId);
    const status = this.normalizeStatus(rawEnrollment.status);
    const workflowStatus = this.normalizeWorkflowStatus(rawEnrollment.workflowStatus, status);
    const priority = this.normalizePriority(rawEnrollment.priority);
    const enrollDate = typeof rawEnrollment.enrollDate === 'string' ? rawEnrollment.enrollDate : new Date().toISOString();
    const score = this.normalizeScore(rawEnrollment.score ?? null);
    const decisionReason =
      typeof rawEnrollment.decisionReason === 'string' && rawEnrollment.decisionReason.trim().length > 0
        ? rawEnrollment.decisionReason
        : status === 'dropped'
          ? '退课流程已完成'
          : status === 'completed'
            ? '课程归档完成'
            : '等待审核';

    return {
      id: rawEnrollment.id,
      studentId: rawEnrollment.studentId,
      courseId: rawEnrollment.courseId,
      score,
      grade: this.calculateGrade(score),
      status,
      workflowStatus,
      priority,
      operator:
        typeof rawEnrollment.operator === 'string' && rawEnrollment.operator.trim().length > 0
          ? rawEnrollment.operator
          : '教务运营台',
      decisionReason,
      decisionAt:
        typeof rawEnrollment.decisionAt === 'string'
          ? rawEnrollment.decisionAt
          : workflowStatus === 'approved' || workflowStatus === 'rejected'
            ? enrollDate
            : null,
      slaDeadline:
        typeof rawEnrollment.slaDeadline === 'string'
          ? rawEnrollment.slaDeadline
          : new Date(new Date(enrollDate).getTime() + this.resolveSlaHours(status) * 60 * 60 * 1000).toISOString(),
      riskFlags:
        Array.isArray(rawEnrollment.riskFlags) && rawEnrollment.riskFlags.length > 0
          ? rawEnrollment.riskFlags.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : this.buildRiskFlags(score, status, workflowStatus, course?.students ?? 0, new Date(enrollDate)),
      enrollDate,
      updatedAt: typeof rawEnrollment.updatedAt === 'string' ? rawEnrollment.updatedAt : enrollDate,
    };
  }

  private normalizeInput(
    input: EnrollmentUpsertInput,
    now: Date,
    courseStudents: number,
    existingEnrollment?: Enrollment,
  ): Omit<Enrollment, 'id' | 'updatedAt' | 'enrollDate'> {
    const score = this.normalizeScore(input.score);
    const status = this.normalizeStatus(input.status);
    const workflowStatus = this.normalizeWorkflowStatus(input.workflowStatus, status);
    const priority = this.resolvePriority(score, status, workflowStatus, courseStudents, input.priority);
    const operator = input.operator?.trim() || existingEnrollment?.operator || '教务运营台';
    const decisionReason =
      input.decisionReason?.trim() ||
      existingEnrollment?.decisionReason ||
      (status === 'dropped' ? '退课流程已完成' : workflowStatus === 'approved' ? '记录审核通过' : '等待审核');

    return {
      studentId: input.studentId,
      courseId: input.courseId,
      score,
      grade: this.calculateGrade(score),
      status,
      workflowStatus,
      priority,
      operator,
      decisionReason,
      decisionAt:
        workflowStatus === 'approved' || workflowStatus === 'rejected'
          ? now.toISOString()
          : existingEnrollment?.decisionAt ?? null,
      slaDeadline:
        existingEnrollment?.slaDeadline ??
        new Date(now.getTime() + this.resolveSlaHours(status) * 60 * 60 * 1000).toISOString(),
      riskFlags: this.buildRiskFlags(score, status, workflowStatus, courseStudents, now),
    };
  }

  private normalizeScore(score: number | null): number | null {
    if (score === null || score === undefined) {
      return null;
    }

    if (!Number.isFinite(score)) {
      throw new Error('成绩必须是有效数字');
    }

    const roundedScore = Math.round(score);
    if (roundedScore < 0 || roundedScore > 100) {
      throw new Error('成绩必须在 0 到 100 之间');
    }

    return roundedScore;
  }

  private normalizeStatus(status: EnrollmentStatus | undefined): EnrollmentStatus {
    if (status === 'completed' || status === 'dropped') {
      return status;
    }

    return 'enrolled';
  }

  private normalizeWorkflowStatus(
    workflowStatus: EnrollmentWorkflowStatus | undefined,
    status: EnrollmentStatus,
  ): EnrollmentWorkflowStatus {
    if (workflowStatus === 'draft' || workflowStatus === 'pending-review' || workflowStatus === 'approved' || workflowStatus === 'rejected') {
      return workflowStatus;
    }

    return this.resolveWorkflowStatus(status);
  }

  private normalizePriority(priority: EnrollmentPriority | undefined): EnrollmentPriority {
    if (priority === 'attention' || priority === 'urgent') {
      return priority;
    }

    return 'routine';
  }

  private ensureEnrollmentUnique(studentId: number, courseId: number, currentEnrollmentId?: number): void {
    const duplicatedEnrollment = this.enrollmentState().find(
      enrollment =>
        enrollment.studentId === studentId &&
        enrollment.courseId === courseId &&
        enrollment.id !== currentEnrollmentId,
    );

    if (duplicatedEnrollment) {
      throw new Error('该学生已存在相同课程的选课记录');
    }
  }

  private resolveWorkflowStatus(
    status: EnrollmentStatus,
    current?: EnrollmentWorkflowStatus,
  ): EnrollmentWorkflowStatus {
    if (current) {
      return current;
    }

    if (status === 'completed') {
      return 'approved';
    }

    if (status === 'dropped') {
      return 'rejected';
    }

    return 'pending-review';
  }

  private resolvePriority(
    score: number | null,
    status: EnrollmentStatus,
    workflowStatus: EnrollmentWorkflowStatus,
    courseStudents: number,
    current?: EnrollmentPriority,
  ): EnrollmentPriority {
    if (current === 'attention' || current === 'urgent') {
      return current;
    }

    if (status === 'dropped' || workflowStatus === 'rejected' || (score !== null && score < 60)) {
      return 'urgent';
    }

    if (workflowStatus === 'pending-review' || courseStudents >= 160) {
      return 'attention';
    }

    return 'routine';
  }

  private resolveSlaHours(status: EnrollmentStatus): number {
    if (status === 'dropped') {
      return 12;
    }

    if (status === 'completed') {
      return 24;
    }

    return 48;
  }

  private buildRiskFlags(
    score: number | null,
    status: EnrollmentStatus,
    workflowStatus: EnrollmentWorkflowStatus,
    courseStudents: number,
    referenceDate: Date,
  ): readonly string[] {
    const flags: string[] = [];
    const slaDeadline = referenceDate.getTime() + this.resolveSlaHours(status) * 60 * 60 * 1000;

    if (score !== null && score < 60) {
      flags.push('成绩预警');
    }

    if (status === 'dropped') {
      flags.push('退课追踪');
    }

    if (workflowStatus === 'pending-review' && slaDeadline < Date.now()) {
      flags.push('SLA 超时');
    }

    if (courseStudents >= 160) {
      flags.push('大班课程');
    }

    if (status === 'completed' && score === null) {
      flags.push('结课未录分');
    }

    return flags;
  }

  private resolveSeedStatus(seed: number): EnrollmentStatus {
    if (seed < 0.18) {
      return 'completed';
    }

    if (seed < 0.28) {
      return 'dropped';
    }

    return 'enrolled';
  }

  private createSeedScore(random: () => number): number {
    const score = 54 + Math.round(random() * 42);
    return Math.max(0, Math.min(100, score));
  }

  private createRandom(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
}

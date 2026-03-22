import { Injectable, computed, signal, inject } from '@angular/core';
import { Enrollment, EnrollmentUpsertInput, EnrollmentStatus } from '../models/enrollment.model';
import { StudentStoreService } from './student-store.service';
import { CourseStoreService } from './course-store.service';
import { safeStorageGetItem, safeStorageSetItem } from '../utils/safe-storage.util';

const STORAGE_KEY = 'aurora.course-manager.enrollments';

@Injectable({ providedIn: 'root' })
export class EnrollmentStoreService {
  private readonly enrollmentState = signal<readonly Enrollment[]>(this.loadEnrollments());

  readonly enrollments = computed(() => this.enrollmentState());
  
  private studentStore = inject(StudentStoreService);
  private courseStore = inject(CourseStoreService);

  getEnrollmentById(enrollmentId: number): Enrollment | undefined {
    return this.enrollmentState().find(enr => enr.id === enrollmentId);
  }

  getEnrollmentsByStudent(studentId: number): Enrollment[] {
    return this.enrollmentState().filter(enr => enr.studentId === studentId);
  }

  getEnrollmentsByCourse(courseId: number): Enrollment[] {
    return this.enrollmentState().filter(enr => enr.courseId === courseId);
  }

  createEnrollment(input: EnrollmentUpsertInput): Enrollment {
    if (!this.studentStore.getStudentById(input.studentId)) {
      throw new Error('Student not found');
    }
    if (!this.courseStore.getCourseById(input.courseId)) {
      throw new Error('Course not found');
    }
    
    // Check duplicate
    const existing = this.enrollmentState().find(
      e => e.studentId === input.studentId && e.courseId === input.courseId
    );
    if (existing) {
      throw new Error('Student is already enrolled in this course');
    }

    const createdEnrollment: Enrollment = {
      id: this.getNextEnrollmentId(),
      updatedAt: new Date().toISOString(),
      studentId: input.studentId,
      courseId: input.courseId,
      score: input.score,
      grade: this.calculateGrade(input.score),
      status: input.status,
      enrollDate: new Date().toISOString(),
    };

    this.writeEnrollments([createdEnrollment, ...this.enrollmentState()]);
    return createdEnrollment;
  }

  updateEnrollment(enrollmentId: number, input: EnrollmentUpsertInput): Enrollment {
    const existingEnrollment = this.getEnrollmentById(enrollmentId);
    if (!existingEnrollment) {
      throw new Error('Enrollment not found');
    }

    const updatedEnrollment: Enrollment = {
      ...existingEnrollment,
      ...input,
      grade: this.calculateGrade(input.score),
      updatedAt: new Date().toISOString(),
    };

    const nextEnrollments = this.enrollmentState().map(enr =>
      enr.id === enrollmentId ? updatedEnrollment : enr,
    );

    this.writeEnrollments(nextEnrollments);
    return updatedEnrollment;
  }

  removeEnrollment(enrollmentId: number): void {
    const nextEnrollments = this.enrollmentState().filter(enr => enr.id !== enrollmentId);
    this.writeEnrollments(nextEnrollments);
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
        return parsed.filter(
          (item): item is Enrollment =>
            typeof item === 'object' && item !== null &&
            typeof item.id === 'number' && typeof item.studentId === 'number' &&
            typeof item.courseId === 'number' && typeof item.status === 'string'
        );
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
    // Generate a few fake enrollments manually or conditionally
    return [];
  }
}

import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { EnrollmentStoreService } from '../core/services/enrollment-store.service';
import { CourseStoreService } from '../core/services/course-store.service';
import { StudentStoreService } from '../core/services/student-store.service';
import { Enrollment, EnrollmentUpsertInput } from '../core/models/enrollment.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule, PageHeroComponent, DatePipe],
  template: `
    <div class="page-shell">
      <app-page-hero
        title="选课与成绩"
        subtitle="管理学生的选课记录，录入考核成绩并自动计算绩点等级。"
        badge="Grades Management"
        icon="fact_check"
      />

      <section class="content-grid animate-fade-up">
        <div class="toolbar-card surface-card">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input 
              type="text" 
              placeholder="搜索课程名称或学生姓名..." 
              [ngModel]="searchKeyword()"
              (ngModelChange)="searchKeyword.set($event)"
            />
          </div>
          <button class="btn-primary" matRipple (click)="startCreate()">
            <mat-icon>library_add</mat-icon> 新增选课记录
          </button>
        </div>

        @if (showEditor()) {
          <div class="editor-panel surface-card animate-scale-in">
            <h3>{{ editingEnrollmentId() ? '编辑' : '新增' }}选课记录</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>选择学生</label>
                <select [(ngModel)]="editForm.studentId" [disabled]="editingEnrollmentId() !== null">
                  @for (student of allStudents(); track student.id) {
                    <option [value]="student.id">{{ student.studentNo }} - {{ student.name }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>选择课程</label>
                <select [(ngModel)]="editForm.courseId" [disabled]="editingEnrollmentId() !== null">
                  @for (course of allCourses(); track course.id) {
                    <option [value]="course.id">{{ course.name }} ({{ course.instructor }})</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label>成绩分数 (0-100)</label>
                <input type="number" [(ngModel)]="editForm.score" placeholder="尚未录入可留空" min="0" max="100" />
              </div>
              <div class="form-field">
                <label>选课状态</label>
                <select [(ngModel)]="editForm.status">
                  <option value="enrolled">在读</option>
                  <option value="completed">已结课</option>
                  <option value="dropped">退课</option>
                </select>
              </div>
            </div>
            
            @if (enrollmentError()) {
              <div class="error-msg"><mat-icon>error</mat-icon> {{ enrollmentError() }}</div>
            }
            
            <div class="actions">
              <button class="btn-secondary" (click)="cancelEdit()">取消</button>
              <button class="btn-primary" (click)="saveEnrollment()">保存记录</button>
            </div>
          </div>
        }

        <div class="table-container surface-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>课程名称</th>
                <th>学生信息</th>
                <th>分数</th>
                <th>等级</th>
                <th>状态</th>
                <th>录入时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (enr of viewModels(); track enr.id) {
                <tr>
                  <td>
                    <div class="course-cell">
                      <mat-icon class="course-icon">book</mat-icon>
                      <div class="course-info">
                        <strong>{{ enr.courseName }}</strong>
                        <span>{{ enr.courseInstructor }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="student-info">
                      <strong>{{ enr.studentName }}</strong>
                      <span>{{ enr.studentNo }}</span>
                    </div>
                  </td>
                  <td>
                    <strong class="score-display" [class.empty]="enr.score === null">
                      {{ enr.score !== null ? enr.score : '-' }}
                    </strong>
                  </td>
                  <td>
                    <span class="grade-badge" [class]="'grade-' + enr.grade.toLowerCase()">{{ enr.grade }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status-' + enr.status">
                      {{ getStatusLabel(enr.status) }}
                    </span>
                  </td>
                  <td class="time-cell">{{ enr.enrollDate | date:'yyyy-MM-dd' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn" title="录入成绩" (click)="startEdit(enr)">
                        <mat-icon>edit_note</mat-icon>
                      </button>
                      <button class="icon-btn danger" title="删除记录" (click)="deleteEnrollment(enr.id)">
                        <mat-icon>delete_sweep</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (viewModels().length === 0) {
            <div class="empty-state">
              <mat-icon>receipt_long</mat-icon>
              <p>暂无符合条件的选课记录</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; padding: 0 28px 40px; }
    .toolbar-card {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; margin-bottom: 24px;
    }
    .search-box {
      display: flex; align-items: center; background: var(--bg-surface-low);
      border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      padding: 8px 16px; width: 300px;
      mat-icon { color: var(--text-tertiary); margin-right: 8px; font-size: 20px; width: 20px; height: 20px; }
      input {
        border: none; background: transparent; outline: none; color: var(--text-primary);
        width: 100%; font-family: inherit;
        &::placeholder { color: var(--text-tertiary); }
      }
      &:focus-within { border-color: var(--accent-primary); }
    }
    .btn-primary {
      display: flex; align-items: center; gap: 6px; padding: 10px 20px;
      background: var(--accent-primary); color: var(--text-on-accent);
      border: none; border-radius: var(--radius-sm); font-weight: 500;
      cursor: pointer; transition: all 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: var(--accent-primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    }
    .btn-secondary {
      padding: 10px 20px; background: transparent; color: var(--text-secondary);
      border: 1px solid var(--border-default); border-radius: var(--radius-sm);
      font-weight: 500; cursor: pointer;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }
    .editor-panel {
      padding: 24px; margin-bottom: 24px; border-top: 4px solid var(--accent-secondary);
      h3 { margin: 0 0 20px 0; font-size: 1.1rem; color: var(--text-primary); }
    }
    .form-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;
    }
    .form-field {
      display: flex; flex-direction: column; gap: 8px;
      label { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); }
      input, select {
        padding: 10px 12px; border: 1px solid var(--border-default); border-radius: var(--radius-sm);
        background: var(--bg-surface-low); color: var(--text-primary); font-family: inherit; outline: none; transition: border-color 0.2s;
        &:focus { border-color: var(--accent-primary); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }
    }
    .error-msg { display: flex; align-items: center; gap: 6px; color: var(--accent-error); font-size: 0.9rem; margin-bottom: 16px; background: var(--accent-error-container); padding: 8px 12px; border-radius: 6px; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .actions { display: flex; justify-content: flex-end; gap: 12px; }
    
    .table-container { overflow-x: auto; padding: 0; }
    .data-table {
      width: 100%; border-collapse: collapse; text-align: left;
      th, td { padding: 16px 24px; border-bottom: 1px solid var(--border-default); vertical-align: middle; }
      th { font-weight: 500; color: var(--text-secondary); font-size: 0.85rem; background: var(--bg-surface-low); letter-spacing: 0.05em; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--bg-tint); }
    }
    .course-cell {
      display: flex; align-items: center; gap: 12px;
      .course-icon { background: var(--accent-primary-container); color: var(--accent-primary); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
      .course-info { display: flex; flex-direction: column; strong { font-size: 0.95rem; } span { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; } }
    }
    .student-info { display: flex; flex-direction: column; strong { font-size: 0.95rem; } span { font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; font-family: var(--font-mono); } }
    .score-display { font-size: 1.1rem; color: var(--text-primary); &.empty { color: var(--text-tertiary); font-weight: 400; } }
    .time-cell { font-size: 0.85rem; color: var(--text-secondary); }
    
    .grade-badge {
      display: inline-block; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; background: var(--bg-surface-low); border: 1px solid var(--border-default);
      &.grade-a { color: var(--accent-success); border-color: var(--accent-success); background: var(--accent-success-container); }
      &.grade-b { color: var(--accent-info); border-color: var(--accent-info); background: var(--accent-info-container); }
      &.grade-c { color: var(--accent-warning); border-color: var(--accent-warning); background: var(--accent-warning-container); }
      &.grade-d { color: var(--accent-grade-d); border-color: var(--accent-grade-d); background: var(--accent-grade-d-container); }
      &.grade-f { color: var(--accent-grade-f); border-color: var(--accent-grade-f); background: var(--accent-grade-f-container); }
    }
    .status-badge {
      display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
      &.status-enrolled { background: var(--accent-primary-container); color: var(--accent-primary); }
      &.status-completed { background: var(--accent-success-container); color: var(--accent-success); }
      &.status-dropped { background: var(--accent-error-container); color: var(--accent-error); }
    }
    
    .action-buttons { display: flex; gap: 8px; }
    .icon-btn {
      width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.2s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { background: var(--bg-hover); color: var(--accent-primary); }
      &.danger:hover { background: var(--accent-error-container); color: var(--accent-error); }
    }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: var(--text-tertiary); mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; } }
  `]
})
export class EnrollmentsComponent {
  private readonly store = inject(EnrollmentStoreService);
  private readonly courseStore = inject(CourseStoreService);
  private readonly studentStore = inject(StudentStoreService);
  
  readonly searchKeyword = signal('');
  readonly creating = signal(false);
  readonly editingEnrollmentId = signal<number | null>(null);
  readonly enrollmentError = signal<string | null>(null);

  readonly allCourses = this.courseStore.courses;
  readonly allStudents = this.studentStore.students;
  readonly enrollments = this.store.enrollments;

  readonly viewModels = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    
    const mapped = this.enrollments().map(enr => {
      const course = this.courseStore.getCourseById(enr.courseId);
      const student = this.studentStore.getStudentById(enr.studentId);
      return {
        ...enr,
        courseName: course?.name || '未知课程',
        courseInstructor: course?.instructor || '',
        studentName: student?.name || '未知学生',
        studentNo: student?.studentNo || '',
      };
    });

    if (!keyword) return mapped;
    
    return mapped.filter(item => 
      item.courseName.toLowerCase().includes(keyword) || 
      item.studentName.toLowerCase().includes(keyword) ||
      item.studentNo.includes(keyword)
    );
  });

  readonly showEditor = computed(() => this.creating() || this.editingEnrollmentId() !== null);

  editForm: any = this.getEmptyForm();

  startCreate(): void {
    this.creating.set(true);
    this.editingEnrollmentId.set(null);
    this.enrollmentError.set(null);
    const students = this.allStudents();
    const courses = this.allCourses();
    this.editForm = this.getEmptyForm();
    if (students.length > 0) this.editForm.studentId = students[0].id;
    if (courses.length > 0) this.editForm.courseId = courses[0].id;
  }

  startEdit(enr: any): void {
    this.creating.set(false);
    this.editingEnrollmentId.set(enr.id);
    this.enrollmentError.set(null);
    this.editForm = { 
      studentId: enr.studentId, 
      courseId: enr.courseId, 
      score: enr.score, 
      status: enr.status 
    };
  }

  cancelEdit(): void {
    this.creating.set(false);
    this.editingEnrollmentId.set(null);
    this.enrollmentError.set(null);
  }

  saveEnrollment(): void {
    const id = this.editingEnrollmentId();
    try {
      if (id) {
        this.store.updateEnrollment(id, {
          studentId: Number(this.editForm.studentId),
          courseId: Number(this.editForm.courseId),
          score: this.editForm.score === '' || this.editForm.score === null ? null : Number(this.editForm.score),
          status: this.editForm.status
        });
      } else {
        this.store.createEnrollment({
          studentId: Number(this.editForm.studentId),
          courseId: Number(this.editForm.courseId),
          score: this.editForm.score === '' || this.editForm.score === null ? null : Number(this.editForm.score),
          status: this.editForm.status
        });
      }
      this.cancelEdit();
    } catch (err: any) {
      this.enrollmentError.set(err.message || '保存失败');
    }
  }

  deleteEnrollment(id: number): void {
    if (confirm(`确定要删除此条记录吗？`)) {
      this.store.removeEnrollment(id);
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { 'enrolled': '在读', 'completed': '已结课', 'dropped': '退课' };
    return map[status] || status;
  }

  private getEmptyForm() {
    return { studentId: null, courseId: null, score: null, status: 'enrolled' };
  }
}

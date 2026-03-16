import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { Teacher, TeacherUpsertInput } from '../core/models/teacher.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule, PageHeroComponent],
  template: `
    <div class="page-shell">
      <app-page-hero
        title="教师团队"
        subtitle="管理全校教研人员信息，分配授课权限。"
        badge="Faculty Management"
        icon="school"
      />

      <section class="content-grid animate-fade-up">
        <div class="toolbar-card surface-card">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input 
              type="text" 
              placeholder="搜索教师姓名或院系..." 
              [ngModel]="searchKeyword()"
              (ngModelChange)="searchKeyword.set($event)"
            />
          </div>
          <button class="btn-primary" matRipple (click)="startCreate()">
            <mat-icon>add</mat-icon> 新增教师
          </button>
        </div>

        @if (showEditor()) {
          <div class="editor-panel surface-card animate-scale-in">
            <h3>{{ editingTeacherId() ? '编辑' : '新增' }}教师</h3>
            <div class="form-grid">
              <div class="form-field">
                <label>姓名</label>
                <input type="text" [(ngModel)]="editForm.name" placeholder="请输入教师姓名" />
              </div>
              <div class="form-field">
                <label>职称</label>
                <select [(ngModel)]="editForm.title">
                  <option value="教授">教授</option>
                  <option value="副教授">副教授</option>
                  <option value="讲师">讲师</option>
                  <option value="助教">助教</option>
                </select>
              </div>
              <div class="form-field">
                <label>所属院系</label>
                <input type="text" [(ngModel)]="editForm.department" placeholder="如：计算机学院" />
              </div>
              <div class="form-field">
                <label>工作邮箱</label>
                <input type="email" [(ngModel)]="editForm.email" placeholder="example@university.edu.cn" />
              </div>
            </div>
            <div class="actions">
              <button class="btn-secondary" (click)="cancelEdit()">取消</button>
              <button class="btn-primary" (click)="saveTeacher()">保存</button>
            </div>
          </div>
        }

        <div class="table-container surface-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>职称</th>
                <th>院系</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              @for (teacher of filteredTeachers(); track teacher.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar">{{ teacher.name.charAt(0) }}</div>
                      <strong>{{ teacher.name }}</strong>
                    </div>
                  </td>
                  <td><span class="badge info">{{ teacher.title }}</span></td>
                  <td>{{ teacher.department }}</td>
                  <td>{{ teacher.email }}</td>
                  <td>
                    <span class="badge success">在职</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="icon-btn" title="编辑" (click)="startEdit(teacher)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="icon-btn danger" title="删除" (click)="deleteTeacher(teacher)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (filteredTeachers().length === 0) {
            <div class="empty-state">
              <mat-icon>groups</mat-icon>
              <p>暂无符合条件的教师数据</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; padding: 0 28px 40px; }
    .toolbar-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      margin-bottom: 24px;
    }
    .search-box {
      display: flex;
      align-items: center;
      background: var(--bg-surface-low);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      padding: 8px 16px;
      width: 300px;
      mat-icon { color: var(--text-tertiary); margin-right: 8px; font-size: 20px; width: 20px; height: 20px; }
      input {
        border: none;
        background: transparent;
        outline: none;
        color: var(--text-primary);
        width: 100%;
        font-family: inherit;
        &::placeholder { color: var(--text-tertiary); }
      }
      &:focus-within { border-color: var(--accent-primary); }
    }
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: var(--accent-primary);
      color: var(--text-on-accent);
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: var(--accent-primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    }
    .btn-secondary {
      padding: 10px 20px;
      background: transparent;
      color: var(--text-secondary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      font-weight: 500;
      cursor: pointer;
      &:hover { background: var(--bg-hover); color: var(--text-primary); }
    }
    .editor-panel {
      padding: 24px;
      margin-bottom: 24px;
      border-top: 4px solid var(--accent-primary);
      h3 { margin: 0 0 20px 0; font-size: 1.1rem; color: var(--text-primary); }
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      label { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); }
      input, select {
        padding: 10px 12px;
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        background: var(--bg-surface-low);
        color: var(--text-primary);
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
        &:focus { border-color: var(--accent-primary); }
      }
    }
    .actions { display: flex; justify-content: flex-end; gap: 12px; }
    
    .table-container { overflow-x: auto; padding: 0; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      th, td { padding: 16px 24px; border-bottom: 1px solid var(--border-default); }
      th { font-weight: 500; color: var(--text-secondary); font-size: 0.85rem; background: var(--bg-surface-low); text-transform: uppercase; letter-spacing: 0.05em; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: var(--bg-tint); }
    }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-primary-container);
      color: var(--accent-primary-text);
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.9rem;
    }
    .badge {
      padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
      &.success { background: var(--accent-success-container); color: var(--accent-success); }
      &.info { background: var(--accent-info-container); color: var(--accent-info); }
    }
    .action-buttons { display: flex; gap: 8px; }
    .icon-btn {
      width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; cursor: pointer;
      color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: var(--bg-hover); color: var(--accent-primary); }
      &.danger:hover { background: var(--accent-error-container); color: var(--accent-error); }
    }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: var(--text-tertiary); mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; } }
  `]
})
export class TeachersComponent {
  private readonly store = inject(TeacherStoreService);
  
  readonly searchKeyword = signal('');
  readonly creating = signal(false);
  readonly editingTeacherId = signal<number | null>(null);

  readonly teachers = this.store.teachers;
  readonly filteredTeachers = computed(() => {
    const keyword = this.searchKeyword().trim().toLowerCase();
    if (!keyword) return this.teachers();
    
    return this.teachers().filter(t => 
      t.name.toLowerCase().includes(keyword) || 
      t.department.toLowerCase().includes(keyword)
    );
  });

  readonly showEditor = computed(() => this.creating() || this.editingTeacherId() !== null);

  editForm: TeacherUpsertInput = this.getEmptyForm();

  startCreate(): void {
    this.creating.set(true);
    this.editingTeacherId.set(null);
    this.editForm = this.getEmptyForm();
  }

  startEdit(teacher: Teacher): void {
    this.creating.set(false);
    this.editingTeacherId.set(teacher.id);
    this.editForm = { ...teacher };
  }

  cancelEdit(): void {
    this.creating.set(false);
    this.editingTeacherId.set(null);
  }

  saveTeacher(): void {
    const id = this.editingTeacherId();
    if (id) {
      this.store.updateTeacher(id, this.editForm);
    } else {
      this.store.createTeacher(this.editForm);
    }
    this.cancelEdit();
  }

  deleteTeacher(teacher: Teacher): void {
    if (confirm(`确定要删除教师 ${teacher.name} 吗？`)) {
      this.store.removeTeacher(teacher.id);
    }
  }

  private getEmptyForm(): TeacherUpsertInput {
    return { name: '', title: '讲师', department: '', email: '', active: true };
  }
}

import { Component, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TeacherStoreService } from '../core/services/teacher-store.service';
import { TEACHER_STATUS_OPTIONS, TeacherStatus } from '../core/models/teacher.model';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatRippleModule, PageHeroComponent],
  templateUrl: './teacher-detail.component.html',
  styleUrl: './teacher-detail.component.scss',
})
export class TeacherDetailComponent {
  private readonly teacherId: number;
  private readonly statusOptions = TEACHER_STATUS_OPTIONS;

  readonly teacher = computed(() => this.teacherStore.getTeacherById(this.teacherId));

  readonly loadPercent = computed(() => {
    const t = this.teacher();
    if (!t || t.maxWeeklyHours <= 0) return 0;
    return Math.min(160, Math.round((t.currentWeeklyHours / t.maxWeeklyHours) * 100));
  });

  readonly loadLabel = computed(() => {
    const t = this.teacher();
    if (!t) return '';
    if (t.currentWeeklyHours > t.maxWeeklyHours) return '超载';
    if (this.loadPercent() >= 85) return '高负荷';
    return '平稳';
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teacherStore: TeacherStoreService,
    private readonly confirmDialog: ConfirmDialogService,
  ) {
    this.teacherId = Number(this.route.snapshot.paramMap.get('id'));
  }

  getStatusLabel(status: TeacherStatus): string {
    return this.statusOptions.find(o => o.value === status)?.label ?? status;
  }

  async deleteTeacher(): Promise<void> {
    const t = this.teacher();
    if (t && await this.confirmDialog.confirm({
      title: '删除教师档案',
      message: `确认删除教师「${t.name}」（${t.employeeNo}）？此操作不可撤销。`,
      confirmText: '确认删除',
      tone: 'danger',
    })) {
      this.teacherStore.removeTeacher(t.id);
      this.router.navigateByUrl('/teachers');
    }
  }
}

import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CourseStoreService } from '../core/services/course-store.service';
import { extractCourseScheduleDays, WEEKDAY_LABELS, WeekdayLabel } from '../core/utils/course-schedule.util';
import { PageHeroComponent } from '../shared/components/page-hero/page-hero.component';
import { Course } from '../core/models/course.model';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, PageHeroComponent],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.scss',
})
export class ScheduleComponent {
  readonly courses = this.courseStore.courses;
  readonly selectedCourse = signal<Course | null>(null);

  readonly calendarColumns = computed(() =>
    WEEKDAY_LABELS.map(day => ({
      day,
      courses: this.courses()
        .filter(course => extractCourseScheduleDays(course.schedule).includes(day))
        .sort((firstCourse, secondCourse) => firstCourse.schedule.localeCompare(secondCourse.schedule)),
    })),
  );

  readonly totalSlots = computed(() =>
    this.calendarColumns().reduce((sum, col) => sum + col.courses.length, 0),
  );

  readonly activeCount = computed(() =>
    this.courses().filter(c => c.status === 'active').length,
  );

  readonly reminders = computed(() => {
    const courseList = this.courses();
    const plannedCourses = courseList.filter(course => course.status === 'planned');
    const activeCourses = courseList.filter(course => course.status === 'active');
    const busiestDay = this.resolveBusiestDay();

    return [
      {
        title: '本周重点排课日',
        text: `${busiestDay.day} 当前共有 ${busiestDay.count} 门课程安排，建议优先关注教室与教师冲突。`,
        icon: 'event',
      },
      {
        title: '待开课提醒',
        text:
          plannedCourses.length > 0
            ? `还有 ${plannedCourses.length} 门课程未开始，可在课程管理中更新状态与开课时间。`
            : '当前没有待开课课程，本周排期稳定。',
        icon: 'schedule',
      },
      {
        title: '进行中课程',
        text: `${activeCourses.length} 门课程处于进行中，可结合报表页持续跟进进度。`,
        icon: 'play_circle',
      },
    ];
  });

  constructor(private readonly courseStore: CourseStoreService) {}

  openCourseDetail(course: Course): void {
    this.selectedCourse.set(course);
  }

  closeCourseDetail(): void {
    this.selectedCourse.set(null);
  }

  private resolveBusiestDay(): { readonly day: WeekdayLabel; readonly count: number } {
    return this.calendarColumns().reduce(
      (selectedDay, currentDay) =>
        currentDay.courses.length > selectedDay.count
          ? { day: currentDay.day, count: currentDay.courses.length }
          : selectedDay,
      { day: '周一' as WeekdayLabel, count: 0 },
    );
  }
}

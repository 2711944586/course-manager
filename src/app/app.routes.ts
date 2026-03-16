import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(module => module.DashboardComponent),
    data: { animation: 'dashboard', title: '仪表盘总览' },
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./course-list/course-list.component').then(module => module.CourseListComponent),
    data: { animation: 'courses', title: '课程管理' },
  },
  {
    path: 'courses/detail/:id',
    loadComponent: () =>
      import('./course-detail/course-detail.component').then(module => module.CourseDetailComponent),
    data: { animation: 'courseDetail', title: '课程详情' },
  },
  {
    path: 'courses/edit/:id',
    loadComponent: () =>
      import('./course-edit/course-edit.component').then(module => module.CourseEditComponent),
    data: { animation: 'courseEdit', title: '编辑课程' },
  },
  {
    path: 'courses/create',
    loadComponent: () =>
      import('./course-edit/course-edit.component').then(module => module.CourseEditComponent),
    data: { animation: 'courseCreate', title: '新建课程' },
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./students/students.component').then(module => module.StudentsComponent),
    data: { animation: 'students', title: '学生管理' },
  },
  {
    path: 'students/detail/:id',
    loadComponent: () =>
      import('./student-detail/student-detail.component').then(module => module.StudentDetailComponent),
    data: { animation: 'studentDetail', title: '学生详情' },
  },
  {
    path: 'students/edit/:id',
    loadComponent: () =>
      import('./student-edit/student-edit.component').then(module => module.StudentEditComponent),
    data: { animation: 'studentEdit', title: '编辑学生' },
  },
  {
    path: 'students/create',
    loadComponent: () =>
      import('./student-edit/student-edit.component').then(module => module.StudentEditComponent),
    data: { animation: 'studentCreate', title: '新建学生' },
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./schedule/schedule.component').then(module => module.ScheduleComponent),
    data: { animation: 'schedule', title: '教务日程' },
  },
  {
    path: 'teachers',
    loadComponent: () =>
      import('./teachers/teachers.component').then(module => module.TeachersComponent),
    data: { animation: 'teachers', title: '教师管理' },
  },
  {
    path: 'enrollments',
    loadComponent: () =>
      import('./enrollments/enrollments.component').then(module => module.EnrollmentsComponent),
    data: { animation: 'enrollments', title: '选课与成绩' },
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then(module => module.ReportsComponent),
    data: { animation: 'reports', title: '数据报表' },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then(module => module.AnalyticsComponent),
    data: { animation: 'analytics', title: '数据分析' },
  },
  {
    path: 'activity-log',
    loadComponent: () =>
      import('./activity-log/activity-log.component').then(module => module.ActivityLogComponent),
    data: { animation: 'activityLog', title: '活动日志' },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(module => module.SettingsComponent),
    data: { animation: 'settings', title: '系统设置' },
  },
  {
    path: 'course/:id',
    redirectTo: 'courses/detail/:id',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];

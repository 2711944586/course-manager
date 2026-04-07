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
    data: { animation: 'dashboard', title: '仪表盘总览', icon: 'space_dashboard' },
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./course-list/course-list.component').then(module => module.CourseListComponent),
    data: { animation: 'courses', title: '课程管理', icon: 'menu_book' },
  },
  {
    path: 'courses/detail/:id',
    loadComponent: () =>
      import('./course-detail/course-detail.component').then(module => module.CourseDetailComponent),
    data: { animation: 'courseDetail', title: '课程详情', icon: 'article' },
  },
  {
    path: 'courses/edit/:id',
    loadComponent: () =>
      import('./course-edit/course-edit.component').then(module => module.CourseEditComponent),
    data: { animation: 'courseEdit', title: '编辑课程', icon: 'edit_square' },
  },
  {
    path: 'courses/create',
    loadComponent: () =>
      import('./course-edit/course-edit.component').then(module => module.CourseEditComponent),
    data: { animation: 'courseCreate', title: '新建课程', icon: 'add_circle' },
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./students/students.component').then(module => module.StudentsComponent),
    data: { animation: 'students', title: '学生管理', icon: 'groups' },
  },
  {
    path: 'students/detail/:id',
    loadComponent: () =>
      import('./student-detail/student-detail.component').then(module => module.StudentDetailComponent),
    data: { animation: 'studentDetail', title: '学生详情', icon: 'person' },
  },
  {
    path: 'students/edit/:id',
    loadComponent: () =>
      import('./student-edit/student-edit.component').then(module => module.StudentEditComponent),
    data: { animation: 'studentEdit', title: '编辑学生', icon: 'person_edit' },
  },
  {
    path: 'students/create',
    loadComponent: () =>
      import('./student-edit/student-edit.component').then(module => module.StudentEditComponent),
    data: { animation: 'studentCreate', title: '新建学生', icon: 'person_add' },
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./schedule/schedule.component').then(module => module.ScheduleComponent),
    data: { animation: 'schedule', title: '教务日程', icon: 'calendar_month' },
  },
  {
    path: 'teachers',
    loadComponent: () =>
      import('./teachers/teachers.component').then(module => module.TeachersComponent),
    data: { animation: 'teachers', title: '教师管理', icon: 'school' },
  },
  {
    path: 'teachers/edit/:id',
    loadComponent: () =>
      import('./teacher-edit/teacher-edit.component').then(module => module.TeacherEditComponent),
    data: { animation: 'teacherEdit', title: '编辑教师', icon: 'edit' },
  },
  {
    path: 'teachers/create',
    loadComponent: () =>
      import('./teacher-edit/teacher-edit.component').then(module => module.TeacherEditComponent),
    data: { animation: 'teacherCreate', title: '新建教师', icon: 'person_add' },
  },
  {
    path: 'enrollments',
    loadComponent: () =>
      import('./enrollments/enrollments.component').then(module => module.EnrollmentsComponent),
    data: { animation: 'enrollments', title: '选课与成绩', icon: 'fact_check' },
  },
  {
    path: 'enrollments/edit/:id',
    loadComponent: () =>
      import('./enrollment-edit/enrollment-edit.component').then(module => module.EnrollmentEditComponent),
    data: { animation: 'enrollmentEdit', title: '编辑选课', icon: 'edit' },
  },
  {
    path: 'enrollments/create',
    loadComponent: () =>
      import('./enrollment-edit/enrollment-edit.component').then(module => module.EnrollmentEditComponent),
    data: { animation: 'enrollmentCreate', title: '新建选课', icon: 'add_circle' },
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then(module => module.ReportsComponent),
    data: { animation: 'reports', title: '数据报表', icon: 'insights' },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/analytics.component').then(module => module.AnalyticsComponent),
    data: { animation: 'analytics', title: '数据分析', icon: 'analytics' },
  },
  {
    path: 'activity-log',
    loadComponent: () =>
      import('./activity-log/activity-log.component').then(module => module.ActivityLogComponent),
    data: { animation: 'activityLog', title: '活动日志', icon: 'history' },
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then(module => module.SettingsComponent),
    data: { animation: 'settings', title: '系统设置', icon: 'settings' },
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

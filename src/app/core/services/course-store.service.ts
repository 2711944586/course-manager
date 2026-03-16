import { Injectable, computed, signal } from '@angular/core';
import { Course, CourseStatus, CourseUpsertInput } from '../models/course.model';

const STORAGE_KEY = 'aurora.course-manager.courses';
const MIN_NAME_LENGTH = 2;
const MIN_DESCRIPTION_LENGTH = 10;

const SEED_COURSES: readonly Course[] = [
  {
    id: 1,
    name: '高等数学 A',
    instructor: '王教授',
    schedule: '周一 / 周三 09:00 - 10:30',
    description: '覆盖极限、微分与积分，结合案例进行章节化训练。',
    progress: 74,
    students: 156,
    status: 'active',
    icon: 'functions',
    updatedAt: '2026-03-10T09:00:00.000Z',
  },
  {
    id: 2,
    name: '数据结构与算法',
    instructor: '陈老师',
    schedule: '周二 / 周四 14:00 - 15:30',
    description: '围绕链表、树、图与复杂度分析，安排每周代码实践。',
    progress: 58,
    students: 120,
    status: 'active',
    icon: 'account_tree',
    updatedAt: '2026-03-11T06:30:00.000Z',
  },
  {
    id: 3,
    name: '数据库系统原理',
    instructor: '李老师',
    schedule: '周五 10:00 - 12:00',
    description: '从关系模型到事务隔离，配套课程项目与性能优化讨论。',
    progress: 81,
    students: 98,
    status: 'active',
    icon: 'storage',
    updatedAt: '2026-03-08T04:20:00.000Z',
  },
  {
    id: 4,
    name: '计算机网络',
    instructor: '赵副教授',
    schedule: '周三 / 周五 15:30 - 17:00',
    description: 'TCP/IP 协议栈、路由算法与网络安全基础实验。',
    progress: 42,
    students: 134,
    status: 'active',
    icon: 'lan',
    updatedAt: '2026-03-09T12:10:00.000Z',
  },
  {
    id: 5,
    name: '人工智能导论',
    instructor: '刘教授',
    schedule: '周一 / 周四 10:30 - 12:00',
    description: '机器学习基础、神经网络与深度学习实践项目。',
    progress: 35,
    students: 210,
    status: 'active',
    icon: 'psychology',
    updatedAt: '2026-03-07T15:45:00.000Z',
  },
  {
    id: 6,
    name: '操作系统',
    instructor: '张老师',
    schedule: '周二 / 周四 08:00 - 09:30',
    description: '进程管理、内存分配、文件系统与并发编程实验。',
    progress: 66,
    students: 142,
    status: 'active',
    icon: 'memory',
    updatedAt: '2026-03-12T01:00:00.000Z',
  },
  {
    id: 7,
    name: '线性代数',
    instructor: '周教授',
    schedule: '周二 / 周五 09:00 - 10:30',
    description: '矩阵运算、向量空间、特征值分解与线性变换的工程应用。',
    progress: 100,
    students: 138,
    status: 'completed',
    icon: 'grid_on',
    updatedAt: '2026-02-28T14:00:00.000Z',
  },
  {
    id: 8,
    name: '软件工程',
    instructor: '吴副教授',
    schedule: '周一 / 周三 14:00 - 15:30',
    description: '需求分析、UML 建模、敏捷开发流程与团队协作项目管理。',
    progress: 52,
    students: 108,
    status: 'active',
    icon: 'engineering',
    updatedAt: '2026-03-13T08:15:00.000Z',
  },
  {
    id: 9,
    name: '编译原理',
    instructor: '孙老师',
    schedule: '周四 10:00 - 12:00',
    description: '词法分析、语法分析、语义分析与代码生成，含实验编译器项目。',
    progress: 0,
    students: 76,
    status: 'planned',
    icon: 'code',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 10,
    name: '概率论与数理统计',
    instructor: '何教授',
    schedule: '周三 / 周六 08:00 - 09:30',
    description: '概率空间、随机变量、假设检验与回归分析，提供 R 语言实践。',
    progress: 88,
    students: 162,
    status: 'active',
    icon: 'analytics',
    updatedAt: '2026-03-11T16:30:00.000Z',
  },
  {
    id: 11,
    name: '前端开发实践',
    instructor: '陈老师',
    schedule: '周六 14:00 - 17:00',
    description: 'HTML/CSS/JS 到 Angular/React 框架实战，覆盖组件化、状态管理与性能调优。',
    progress: 0,
    students: 95,
    status: 'planned',
    icon: 'web',
    updatedAt: '2026-03-05T09:20:00.000Z',
  },
  {
    id: 12,
    name: '大学英语 IV',
    instructor: '林老师',
    schedule: '周一 / 周三 16:00 - 17:30',
    description: '学术英语写作、口语表达与跨文化交际能力培养。',
    progress: 100,
    students: 180,
    status: 'completed',
    icon: 'translate',
    updatedAt: '2026-02-25T11:00:00.000Z',
  },
];

@Injectable({ providedIn: 'root' })
export class CourseStoreService {
  private readonly courseState = signal<readonly Course[]>(this.loadCourses());

  readonly courses = computed(() => this.courseState());

  getCourseById(courseId: number): Course | undefined {
    return this.courseState().find(course => course.id === courseId);
  }

  createCourse(input: CourseUpsertInput): Course {
    const normalizedInput = this.normalizeInput(input);
    const createdCourse: Course = {
      id: this.getNextCourseId(),
      updatedAt: new Date().toISOString(),
      ...normalizedInput,
    };

    this.writeCourses([createdCourse, ...this.courseState()]);
    return createdCourse;
  }

  updateCourse(courseId: number, input: CourseUpsertInput): Course {
    const existingCourse = this.getCourseById(courseId);
    if (!existingCourse) {
      throw new Error('课程不存在，无法更新');
    }

    const normalizedInput = this.normalizeInput(input);
    const updatedCourse: Course = {
      ...existingCourse,
      ...normalizedInput,
      updatedAt: new Date().toISOString(),
    };

    const nextCourses = this.courseState().map(course =>
      course.id === courseId ? updatedCourse : course,
    );

    this.writeCourses(nextCourses);
    return updatedCourse;
  }

  removeCourse(courseId: number): void {
    const nextCourses = this.courseState().filter(course => course.id !== courseId);
    if (nextCourses.length === this.courseState().length) {
      throw new Error('课程不存在，无法删除');
    }

    this.writeCourses(nextCourses);
  }

  updateProgress(courseId: number, nextProgress: number): Course {
    const targetCourse = this.getCourseById(courseId);
    if (!targetCourse) {
      throw new Error('课程不存在，无法更新进度');
    }

    const normalizedProgress = this.normalizeProgress(nextProgress);
    const updatedStatus = this.resolveStatusByProgress(targetCourse.status, normalizedProgress);

    const updatedCourse: Course = {
      ...targetCourse,
      progress: normalizedProgress,
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    };

    const nextCourses = this.courseState().map(course =>
      course.id === courseId ? updatedCourse : course,
    );

    this.writeCourses(nextCourses);
    return updatedCourse;
  }

  private writeCourses(courses: readonly Course[]): void {
    this.courseState.set(courses);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }

  private loadCourses(): readonly Course[] {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return SEED_COURSES;
    }

    try {
      const parsedData = JSON.parse(rawData) as unknown;
      if (Array.isArray(parsedData)) {
        const validCourses = parsedData.filter(item => this.isCourse(item));
        if (validCourses.length > 0) {
          return validCourses;
        }
      }
    } catch {
      return SEED_COURSES;
    }

    return SEED_COURSES;
  }

  private getNextCourseId(): number {
    return this.courseState().reduce((maxId, course) => Math.max(maxId, course.id), 0) + 1;
  }

  private normalizeInput(input: CourseUpsertInput): Omit<Course, 'id' | 'updatedAt'> {
    const normalizedName = input.name.trim();
    const normalizedInstructor = input.instructor.trim();
    const normalizedSchedule = input.schedule.trim();
    const normalizedDescription = input.description.trim();

    if (normalizedName.length < MIN_NAME_LENGTH) {
      throw new Error('课程名称至少需要 2 个字符');
    }

    if (!normalizedInstructor) {
      throw new Error('授课教师不能为空');
    }

    if (!normalizedSchedule) {
      throw new Error('上课时间不能为空');
    }

    if (normalizedDescription.length < MIN_DESCRIPTION_LENGTH) {
      throw new Error('课程简介至少需要 10 个字符');
    }

    const normalizedProgress = this.normalizeProgress(input.progress);
    const normalizedStudents = this.normalizeStudents(input.students);
    const normalizedStatus = this.resolveStatusByProgress(input.status, normalizedProgress);

    return {
      name: normalizedName,
      instructor: normalizedInstructor,
      schedule: normalizedSchedule,
      description: normalizedDescription,
      progress: normalizedProgress,
      students: normalizedStudents,
      status: normalizedStatus,
      icon: input.icon.trim() || 'menu_book',
    };
  }

  private normalizeProgress(progress: number): number {
    if (!Number.isFinite(progress)) {
      throw new Error('课程进度必须是有效数字');
    }

    const roundedProgress = Math.round(progress);
    if (roundedProgress < 0 || roundedProgress > 100) {
      throw new Error('课程进度需在 0 到 100 之间');
    }

    return roundedProgress;
  }

  private normalizeStudents(students: number): number {
    if (!Number.isFinite(students)) {
      throw new Error('学生人数必须是有效数字');
    }

    const roundedStudents = Math.round(students);
    if (roundedStudents < 0) {
      throw new Error('学生人数不能为负数');
    }

    return roundedStudents;
  }

  private resolveStatusByProgress(status: CourseStatus, progress: number): CourseStatus {
    if (progress === 100) {
      return 'completed';
    }

    if (progress === 0 && status === 'active') {
      return 'planned';
    }

    if (progress > 0 && status === 'planned') {
      return 'active';
    }

    return status;
  }

  private isCourse(candidate: unknown): candidate is Course {
    if (!candidate || typeof candidate !== 'object') {
      return false;
    }

    const typedCourse = candidate as Partial<Course>;
    const isValidStatus = typedCourse.status === 'planned' || typedCourse.status === 'active' || typedCourse.status === 'completed';

    return (
      typeof typedCourse.id === 'number' &&
      typeof typedCourse.name === 'string' &&
      typeof typedCourse.instructor === 'string' &&
      typeof typedCourse.schedule === 'string' &&
      typeof typedCourse.description === 'string' &&
      typeof typedCourse.progress === 'number' &&
      typeof typedCourse.students === 'number' &&
      typeof typedCourse.icon === 'string' &&
      typeof typedCourse.updatedAt === 'string' &&
      isValidStatus
    );
  }

  importAll(courses: unknown[]): number {
    const valid = courses.filter((item): item is Course => this.isCourse(item));
    if (valid.length > 0) {
      this.writeCourses(valid);
    }
    return valid.length;
  }
}

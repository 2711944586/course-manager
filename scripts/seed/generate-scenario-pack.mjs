import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'output');

const courseNames = [
  '高等数学 A',
  '数据结构与算法',
  '数据库系统原理',
  '计算机网络',
  '软件工程',
  '离散数学',
  '概率论与数理统计',
  '操作系统',
  '编译原理',
  '信息安全基础',
  '前端工程实践',
  '机器学习导论',
];

const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林'];
const maleNames = ['浩然', '宇轩', '子昂', '明哲', '嘉豪', '俊杰', '博文', '启航', '修远', '承泽'];
const femaleNames = ['雨桐', '若曦', '诗涵', '梦瑶', '语嫣', '嘉怡', '思妍', '梓萱', '可欣', '清妍'];
const departments = ['计算机学院', '数学学院', '物理学院', '外语学院', '商学院', '经济学院'];
const teacherTitles = ['教授', '副教授', '讲师', '助教'];
const expertisePool = ['课程建设', '教学评估', '学业督导', '资源协调', '科研项目', '实践指导'];
const operators = ['教务运营台', '院系秘书组', '课程协调员'];

mkdirSync(outputDir, { recursive: true });

for (const profile of [
  { name: 'standard', courseCount: 18, studentCount: 120, teacherCount: 18, riskBias: 0.14 },
  { name: 'stress', courseCount: 48, studentCount: 960, teacherCount: 72, riskBias: 0.1 },
  { name: 'anomaly', courseCount: 24, studentCount: 180, teacherCount: 24, riskBias: 0.34 },
]) {
  const random = createRandom(profile.name === 'standard' ? 20260331 : profile.name === 'stress' ? 20260401 : 20260402);
  const teachers = createTeachers(profile.teacherCount, random);
  const courses = createCourses(profile.courseCount, teachers, profile.name, random);
  const students = createStudents(profile.studentCount, random);
  const enrollments = createEnrollments(students, courses, profile.riskBias, random);
  const notifications = createNotifications(profile.name, enrollments);
  const activities = createActivities(profile.name, courses, students, teachers, enrollments);

  const workspace = {
    scenario: profile.name,
    generatedAt: new Date().toISOString(),
    summary: {
      courses: courses.length,
      students: students.length,
      teachers: teachers.length,
      enrollments: enrollments.length,
      highRiskEnrollments: enrollments.filter(item => item.riskFlags.length > 0).length,
    },
    courses,
    students,
    teachers,
    enrollments,
    notifications,
    activities,
  };

  writeFileSync(
    path.join(outputDir, `${profile.name}-workspace.json`),
    JSON.stringify(workspace, null, 2),
    'utf8',
  );
}

console.log(`Scenario packs generated in ${outputDir}`);

function createCourses(count, teachers, profileName, random) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const teacher = teachers[index % teachers.length];
    const baseStudents = profileName === 'stress' ? 180 : 72;
    const students = baseStudents + Math.floor(random() * (profileName === 'stress' ? 180 : 90));
    const progress =
      profileName === 'anomaly' && index % 5 === 0
        ? Math.floor(random() * 22)
        : Math.floor(28 + random() * 70);
    const status = progress === 100 ? 'completed' : progress === 0 ? 'planned' : 'active';

    return {
      id: index + 1,
      name: `${courseNames[index % courseNames.length]} ${String.fromCharCode(65 + (index % 4))}`,
      instructor: teacher.name,
      schedule: createSchedule(index),
      description: `${courseNames[index % courseNames.length]}的标准化教学计划，包含章节推进、实验安排与评估节点。`,
      progress,
      students,
      status,
      icon: index % 4 === 0 ? 'analytics' : index % 4 === 1 ? 'menu_book' : index % 4 === 2 ? 'account_tree' : 'science',
      updatedAt: new Date(now - Math.floor(random() * 1000 * 60 * 60 * 24 * 18)).toISOString(),
    };
  });
}

function createStudents(count, random) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const gender = random() > 0.52 ? 'male' : 'female';
    const givenNames = gender === 'male' ? maleNames : femaleNames;
    const surname = surnames[Math.floor(random() * surnames.length)] ?? '王';
    const givenName = givenNames[Math.floor(random() * givenNames.length)] ?? '同学';

    return {
      id: index + 1,
      name: `${surname}${givenName}`,
      studentNo: `2026${String(index + 1).padStart(4, '0')}`,
      gender,
      birthDate: createBirthDate(random),
      score: createScore(random),
      updatedAt: new Date(now - Math.floor(random() * 1000 * 60 * 60 * 24 * 20)).toISOString(),
    };
  });
}

function createTeachers(count, random) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const surname = surnames[index % surnames.length];
    const givenName = maleNames[index % maleNames.length];
    const title = teacherTitles[index % teacherTitles.length];
    const maxWeeklyHours = title === '教授' ? 8 : title === '副教授' ? 10 : 12;
    const currentWeeklyHours = Math.min(maxWeeklyHours + (index % 6 === 0 ? 2 : 0), maxWeeklyHours + 4);
    const status = index % 7 === 0 ? 'pending' : index % 5 === 0 ? 'leave' : 'active';

    return {
      id: index + 1,
      employeeNo: `T${String(30001 + index).padStart(5, '0')}`,
      name: `${surname}${givenName}`,
      title,
      department: departments[index % departments.length],
      email: `teacher${index + 1}@campus.example.edu.cn`,
      phone: `138${String(10000000 + index * 97).slice(0, 8)}`,
      office: `博学楼 ${String.fromCharCode(65 + (index % 4))}-${200 + index}`,
      expertise: [expertisePool[index % expertisePool.length], expertisePool[(index + 2) % expertisePool.length]],
      maxWeeklyHours,
      currentWeeklyHours,
      status,
      active: status === 'active',
      lastReviewAt: new Date(now - Math.floor(random() * 1000 * 60 * 60 * 24 * 14)).toISOString(),
      updatedAt: new Date(now - Math.floor(random() * 1000 * 60 * 60 * 24 * 10)).toISOString(),
    };
  });
}

function createEnrollments(students, courses, riskBias, random) {
  const records = [];
  const pairSet = new Set();
  const targetCount = Math.min(students.length * 2, courses.length * 12);

  for (let index = 0; index < targetCount; index += 1) {
    const student = students[(index * 5) % students.length];
    const course = courses[(index * 7 + Math.floor(random() * 3)) % courses.length];
    const pairKey = `${student.id}-${course.id}`;

    if (!student || !course || pairSet.has(pairKey)) {
      continue;
    }

    pairSet.add(pairKey);

    const enrolledAt = new Date(Date.now() - Math.floor(random() * 1000 * 60 * 60 * 24 * 28));
    const statusSeed = random();
    const status = statusSeed < riskBias ? 'dropped' : statusSeed < riskBias + 0.24 ? 'completed' : 'enrolled';
    const workflowStatus = status === 'completed' ? 'approved' : status === 'dropped' ? 'rejected' : random() < 0.68 ? 'pending-review' : 'draft';
    const score = status === 'completed' || random() < 0.08 ? createScore(random) : null;
    const priority =
      status === 'dropped' || (score !== null && score < 60)
        ? 'urgent'
        : workflowStatus === 'pending-review' || course.students >= 160
          ? 'attention'
          : 'routine';
    const riskFlags = [];

    if (score !== null && score < 60) riskFlags.push('成绩预警');
    if (status === 'dropped') riskFlags.push('退课追踪');
    if (workflowStatus === 'pending-review' && random() < 0.4) riskFlags.push('SLA 超时');
    if (course.students >= 160) riskFlags.push('大班课程');

    records.push({
      id: records.length + 1,
      studentId: student.id,
      courseId: course.id,
      score,
      grade: score === null ? 'N/A' : score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      status,
      workflowStatus,
      priority,
      operator: operators[index % operators.length],
      decisionReason:
        status === 'dropped' ? '学生主动调整学习计划' : status === 'completed' ? '成绩与归档信息已确认' : '待院系完成容量复核',
      decisionAt: workflowStatus === 'approved' || workflowStatus === 'rejected' ? enrolledAt.toISOString() : null,
      slaDeadline: new Date(enrolledAt.getTime() + (status === 'dropped' ? 12 : status === 'completed' ? 24 : 48) * 60 * 60 * 1000).toISOString(),
      riskFlags,
      enrollDate: enrolledAt.toISOString(),
      updatedAt: new Date(enrolledAt.getTime() + Math.floor(random() * 1000 * 60 * 60 * 24 * 5)).toISOString(),
    });
  }

  return records;
}

function createNotifications(profileName, enrollments) {
  const critical = enrollments.filter(item => item.priority === 'urgent').length;

  return [
    {
      id: 1,
      title: '数据场景已加载',
      message: `${profileName} 场景包已完成生成，可用于演示与联调。`,
      type: 'info',
      date: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      title: '风险记录提醒',
      message: `当前场景中存在 ${critical} 条高优先级选课记录。`,
      type: critical > 0 ? 'warning' : 'success',
      date: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      read: false,
    },
  ];
}

function createActivities(profileName, courses, students, teachers, enrollments) {
  const now = Date.now();

  return [
    {
      id: now - 1,
      action: 'create',
      entity: 'system',
      entityName: '系统',
      detail: `生成 ${profileName} 场景数据包`,
      timestamp: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: now - 2,
      action: 'create',
      entity: 'course',
      entityName: courses[0]?.name ?? '课程',
      detail: `同步课程场景：${courses.length} 门`,
      timestamp: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: now - 3,
      action: 'create',
      entity: 'student',
      entityName: students[0]?.name ?? '学生',
      detail: `装载学生档案：${students.length} 名`,
      timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    },
    {
      id: now - 4,
      action: 'update',
      entity: 'teacher',
      entityName: teachers[0]?.name ?? '教师',
      detail: `教师容量同步完成：${teachers.length} 名`,
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: now - 5,
      action: 'create',
      entity: 'enrollment',
      entityName: '选课记录',
      detail: `选课记录装载完成：${enrollments.length} 条`,
      timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
    },
  ];
}

function createSchedule(index) {
  const weekdays = ['周一', '周二', '周三', '周四', '周五'];
  const startHours = ['08:00', '10:00', '14:00', '16:00'];
  const endHours = ['09:30', '11:30', '15:30', '17:30'];

  return `${weekdays[index % weekdays.length]} / ${weekdays[(index + 2) % weekdays.length]} ${startHours[index % startHours.length]} - ${endHours[index % endHours.length]}`;
}

function createBirthDate(random) {
  const startDate = new Date('2001-01-01T00:00:00Z');
  const offsetDays = Math.floor(random() * 365 * 7);
  return new Date(startDate.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function createScore(random) {
  const seed = random();
  if (seed < 0.08) return 35 + Math.floor(random() * 18);
  if (seed < 0.2) return 55 + Math.floor(random() * 10);
  if (seed < 0.45) return 68 + Math.floor(random() * 12);
  if (seed < 0.75) return 80 + Math.floor(random() * 10);
  return 90 + Math.floor(random() * 10);
}

function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export interface BackupData {
  version: 2;
  exportedAt: string;
  courses: unknown[];
  students: unknown[];
  teachers: unknown[];
  enrollments: unknown[];
  notifications: unknown[];
  activities: unknown[];
}

export interface BackupExportPayload {
  readonly courses: readonly unknown[];
  readonly students: readonly unknown[];
  readonly teachers?: readonly unknown[];
  readonly enrollments?: readonly unknown[];
  readonly notifications?: readonly unknown[];
  readonly activities?: readonly unknown[];
}

export function exportBackup(payload: BackupExportPayload): void {
  const backup: BackupData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    courses: [...payload.courses],
    students: [...payload.students],
    teachers: [...(payload.teachers ?? [])],
    enrollments: [...(payload.enrollments ?? [])],
    notifications: [...(payload.notifications ?? [])],
    activities: [...(payload.activities ?? [])],
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `course-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error('请选择 .json 文件'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('备份文件过大（上限 10 MB）'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as unknown;
        if (!data || typeof data !== 'object') {
          reject(new Error('无效的备份文件格式'));
          return;
        }

        const backup = data as Partial<BackupData>;
        if (!Array.isArray(backup.courses) || !Array.isArray(backup.students)) {
          reject(new Error('备份文件缺少课程或学生数据'));
          return;
        }

        resolve({
          version: 2,
          exportedAt: backup.exportedAt ?? '',
          courses: backup.courses,
          students: backup.students,
          teachers: Array.isArray(backup.teachers) ? backup.teachers : [],
          enrollments: Array.isArray(backup.enrollments) ? backup.enrollments : [],
          notifications: Array.isArray(backup.notifications) ? backup.notifications : [],
          activities: Array.isArray(backup.activities) ? backup.activities : [],
        });
      } catch {
        reject(new Error('文件解析失败，请检查 JSON 格式'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

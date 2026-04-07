import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { buildApiUrl } from '../config/api.config';
import { SchoolClass, SchoolClassCreateInput } from '../models/class.model';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly classesUrl = buildApiUrl('/classes');

  constructor(private readonly http: HttpClient) {}

  getClasses(): Observable<readonly SchoolClass[]> {
    return this.http.get<readonly SchoolClass[]>(this.classesUrl).pipe(
      tap(classes => console.info('[ClassService] loaded classes:', classes.length)),
      catchError(error => this.handleError('加载班级列表失败', error)),
    );
  }

  getClass(id: string): Observable<SchoolClass> {
    return this.http.get<SchoolClass>(`${this.classesUrl}/${id}`).pipe(
      tap(schoolClass => console.info('[ClassService] loaded class:', schoolClass.id)),
      catchError(error => this.handleError('加载班级详情失败', error)),
    );
  }

  addClass(payload: SchoolClassCreateInput): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(this.classesUrl, payload).pipe(
      tap(schoolClass => console.info('[ClassService] created class:', schoolClass.id)),
      catchError(error => this.handleError('创建班级失败', error)),
    );
  }

  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`${this.classesUrl}/${id}`).pipe(
      tap(() => console.info('[ClassService] deleted class:', id)),
      catchError(error => this.handleError('删除班级失败', error)),
    );
  }

  private handleError(message: string, error: unknown): Observable<never> {
    console.error(`[ClassService] ${message}`, error);
    return throwError(() => new Error(message));
  }
}

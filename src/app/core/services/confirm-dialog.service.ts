import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogTone,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface ConfirmDialogOptions {
  readonly title: string;
  readonly message: string;
  readonly details?: readonly string[];
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly tone?: ConfirmDialogTone;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const data: ConfirmDialogData = {
      title: options.title,
      message: options.message,
      details: options.details ?? [],
      confirmText: options.confirmText ?? '确认',
      cancelText: options.cancelText ?? '取消',
      tone: options.tone ?? 'primary',
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      restoreFocus: true,
      width: 'min(520px, calc(100vw - 24px))',
      maxWidth: 'calc(100vw - 24px)',
      panelClass: 'confirm-dialog-panel',
      data,
    });

    return firstValueFrom(dialogRef.afterClosed().pipe(map(result => result === true)));
  }
}

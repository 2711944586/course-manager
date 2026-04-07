import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmDialogTone = 'danger' | 'primary' | 'neutral';

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly details?: readonly string[];
  readonly confirmText: string;
  readonly cancelText: string;
  readonly tone: ConfirmDialogTone;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly icon = this.data.tone === 'danger' ? 'warning' : this.data.tone === 'primary' ? 'verified' : 'help';

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData,
  ) {}

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}

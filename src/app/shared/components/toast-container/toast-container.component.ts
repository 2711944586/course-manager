import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type">
          <mat-icon class="toast__icon">
            {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info' }}
          </mat-icon>
          <div class="toast__body">
            <div class="toast__title">{{ toast.title }}</div>
            <div class="toast__message">{{ toast.message }}</div>
          </div>
          <button class="toast__close" (click)="toastService.dismiss(toast.id)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  constructor(readonly toastService: ToastService) {}
}

import { Injectable, signal, computed } from '@angular/core';

export interface ToastItem {
  readonly id: number;
  readonly type: 'success' | 'error' | 'warning' | 'info';
  readonly title: string;
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly items = signal<readonly ToastItem[]>([]);

  readonly toasts = computed(() => this.items());

  show(type: ToastItem['type'], title: string, message: string, duration = 4000): void {
    const id = ++this.nextId;
    const toast: ToastItem = { id, type, title, message };
    this.items.update(list => [...list, toast]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number): void {
    this.items.update(list => list.filter(t => t.id !== id));
  }

  success(title: string, message: string): void {
    this.show('success', title, message);
  }

  error(title: string, message: string): void {
    this.show('error', title, message, 6000);
  }

  info(title: string, message: string): void {
    this.show('info', title, message);
  }

  warning(title: string, message: string): void {
    this.show('warning', title, message, 5000);
  }
}

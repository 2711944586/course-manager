import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UiNotice } from '../../models/ui-notice.model';

@Component({
  selector: 'app-inline-notice',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './inline-notice.component.html',
  styleUrl: './inline-notice.component.scss',
})
export class InlineNoticeComponent {
  readonly notice = input.required<UiNotice>();
  readonly closeText = input('关闭');
  readonly closeRequested = output<void>();

  readonly iconName = computed(() => {
    const type = this.notice().type;
    if (type === 'error') {
      return 'error_outline';
    }

    if (type === 'info') {
      return 'info_outline';
    }

    return 'check_circle_outline';
  });

  close(): void {
    this.closeRequested.emit();
  }
}

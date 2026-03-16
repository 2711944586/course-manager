import { Component, Input } from '@angular/core';
import { ChartDataItem } from './chart.model';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="bar-chart-wrap">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + totalHeight" preserveAspectRatio="xMidYMid meet">
        @for (bar of bars; track bar.label; let i = $index) {
          <g class="bar-group"
             (mouseenter)="hoveredIndex = i"
             (mouseleave)="hoveredIndex = -1">
            <rect
              [attr.x]="barX(i)"
              [attr.y]="barY(bar.value)"
              [attr.width]="barWidth"
              [attr.height]="barHeight(bar.value)"
              [attr.fill]="bar.color || defaultColors[i % defaultColors.length]"
              [attr.rx]="4"
              class="bar-rect"
            />
            <!-- Tooltip background -->
            @if (hoveredIndex === i) {
              <rect
                [attr.x]="barX(i) + barWidth / 2 - 36"
                [attr.y]="barY(bar.value) - 32"
                width="72" height="22" rx="6"
                class="tooltip-bg"
              />
              <text
                [attr.x]="barX(i) + barWidth / 2"
                [attr.y]="barY(bar.value) - 16"
                text-anchor="middle"
                class="tooltip-text"
              >{{ bar.label }}: {{ bar.value }}{{ suffix }}</text>
            }
            @if (hoveredIndex !== i) {
              <text
                [attr.x]="barX(i) + barWidth / 2"
                [attr.y]="barY(bar.value) - 8"
                text-anchor="middle"
                class="bar-value-text"
              >{{ bar.value }}{{ suffix }}</text>
            }
            <text
              [attr.x]="barX(i) + barWidth / 2"
              [attr.y]="chartBottom + 14"
              [attr.text-anchor]="needsRotation ? 'end' : 'middle'"
              [attr.transform]="needsRotation ? 'rotate(-35,' + (barX(i) + barWidth / 2) + ',' + (chartBottom + 14) + ')' : undefined"
              class="bar-label-text"
            >{{ truncateLabel(bar.label) }}</text>
          </g>
        }
      </svg>
    </div>
  `,
  styles: [`
    .bar-chart-wrap {
      width: 100%;
      padding: 16px 0 8px;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .bar-rect {
      transition: opacity 0.2s, filter 0.2s, transform 0.2s;
      cursor: pointer;
      filter: saturate(0.9);
    }
    .bar-group:hover .bar-rect {
      opacity: 0.9;
      filter: saturate(1.15) brightness(1.05);
    }
    .bar-value-text {
      font-size: 11px;
      font-weight: 700;
      fill: var(--text-primary, #1e293b);
      transition: opacity 0.15s;
    }
    .bar-label-text {
      font-size: 10px;
      font-weight: 500;
      fill: var(--text-secondary, #64748b);
    }
    .tooltip-bg {
      fill: var(--bg-tooltip, #1E293B);
      opacity: 0.92;
      animation: fade-in 0.15s ease;
    }
    .tooltip-text {
      font-size: 10px;
      font-weight: 600;
      fill: var(--text-tooltip, #fff);
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class BarChartComponent {
  @Input() data: readonly ChartDataItem[] = [];
  @Input() height = 200;
  @Input() suffix = '';

  hoveredIndex = -1;
  readonly defaultColors = [
    'var(--chart-indigo, #4F46E5)',
    'var(--chart-violet, #7C3AED)',
    'var(--chart-amber, #f59e0b)',
    'var(--chart-red, #ef4444)',
    'var(--chart-emerald, #10b981)',
    'var(--chart-pink, #ec4899)',
    'var(--chart-blue, #3b82f6)',
  ];
  readonly width = 400;
  private readonly padding = 30;

  get needsRotation(): boolean {
    return this.data.length >= 6;
  }

  private get bottomPadding(): number {
    return this.needsRotation ? 60 : 20;
  }

  get totalHeight(): number {
    return this.height + (this.needsRotation ? 40 : 0);
  }

  get chartBottom(): number {
    return this.totalHeight - this.bottomPadding;
  }

  get maxValue(): number {
    return Math.max(...this.data.map(d => d.value), 1);
  }

  get bars(): readonly ChartDataItem[] {
    return this.data;
  }

  get barWidth(): number {
    const count = this.data.length || 1;
    return Math.min(40, (this.width - this.padding * 2) / count * 0.7);
  }

  truncateLabel(label: string): string {
    const maxLen = this.needsRotation ? 6 : 8;
    return label.length > maxLen ? label.slice(0, maxLen) + '…' : label;
  }

  barX(index: number): number {
    const count = this.data.length || 1;
    const totalWidth = this.width - this.padding * 2;
    const step = totalWidth / count;
    return this.padding + step * index + (step - this.barWidth) / 2;
  }

  barY(value: number): number {
    const chartHeight = this.totalHeight - this.padding - this.bottomPadding;
    return this.padding + chartHeight * (1 - value / this.maxValue);
  }

  barHeight(value: number): number {
    const chartHeight = this.totalHeight - this.padding - this.bottomPadding;
    return chartHeight * (value / this.maxValue);
  }
}

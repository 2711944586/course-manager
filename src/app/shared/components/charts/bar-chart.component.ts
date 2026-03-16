import { Component, Input } from '@angular/core';
import { ChartDataItem } from './chart.model';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="bar-chart-wrap">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet">
        @for (bar of bars; track bar.label; let i = $index) {
          <g class="bar-group">
            <rect
              [attr.x]="barX(i)"
              [attr.y]="barY(bar.value)"
              [attr.width]="barWidth"
              [attr.height]="barHeight(bar.value)"
              [attr.fill]="bar.color || defaultColors[i % defaultColors.length]"
              [attr.rx]="4"
              class="bar-rect"
            />
            <text
              [attr.x]="barX(i) + barWidth / 2"
              [attr.y]="barY(bar.value) - 8"
              text-anchor="middle"
              class="bar-value-text"
            >{{ bar.value }}{{ suffix }}</text>
            <text
              [attr.x]="barX(i) + barWidth / 2"
              [attr.y]="height - 4"
              text-anchor="middle"
              class="bar-label-text"
            >{{ bar.label }}</text>
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
      transition: opacity 0.25s, filter 0.25s;
      cursor: pointer;
      filter: saturate(0.9);
    }
    .bar-group:hover .bar-rect {
      opacity: 0.85;
      filter: saturate(1.2) brightness(1.05);
    }
    .bar-value-text {
      font-size: 11px;
      font-weight: 700;
      fill: var(--text-primary, #1e293b);
    }
    .bar-label-text {
      font-size: 10px;
      font-weight: 500;
      fill: var(--text-secondary, #64748b);
    }
  `],
})
export class BarChartComponent {
  @Input() data: readonly ChartDataItem[] = [];
  @Input() height = 200;
  @Input() suffix = '';

  readonly defaultColors = ['#0070f3', '#7c66dc', '#f5a623', '#e5484d', '#0ea371', '#ec4899', '#0091ff'];
  readonly width = 400;
  private readonly padding = 30;
  private readonly bottomPadding = 20;

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

  barX(index: number): number {
    const count = this.data.length || 1;
    const totalWidth = this.width - this.padding * 2;
    const step = totalWidth / count;
    return this.padding + step * index + (step - this.barWidth) / 2;
  }

  barY(value: number): number {
    const chartHeight = this.height - this.padding - this.bottomPadding;
    return this.padding + chartHeight * (1 - value / this.maxValue);
  }

  barHeight(value: number): number {
    const chartHeight = this.height - this.padding - this.bottomPadding;
    return chartHeight * (value / this.maxValue);
  }
}

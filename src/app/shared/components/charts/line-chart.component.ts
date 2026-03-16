import { Component, Input } from '@angular/core';
import { ChartDataItem } from './chart.model';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  template: `
    <div class="line-chart-wrap">
      <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="xMidYMid meet">
        @for (y of gridLines; track y) {
          <line [attr.x1]="padding" [attr.y1]="y" [attr.x2]="width - 10" [attr.y2]="y"
            stroke="var(--border-subtle, #e2e8f0)" stroke-width="1" stroke-dasharray="4 4" />
        }
        <path [attr.d]="areaPath" [attr.fill]="areaColor" opacity="0.1" />
        <path [attr.d]="linePath" fill="none" [attr.stroke]="lineColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round" class="chart-line" />
        @for (pt of points; track pt.label; let i = $index) {
          <!-- Hover crosshair -->
          @if (hoveredPoint === i) {
            <line [attr.x1]="pt.x" [attr.y1]="padding" [attr.x2]="pt.x" [attr.y2]="height - bottomPadding"
              stroke="var(--border-default, #ccc)" stroke-width="1" stroke-dasharray="3 3" opacity="0.5" />
          }
          <circle [attr.cx]="pt.x" [attr.cy]="pt.y" [attr.r]="hoveredPoint === i ? 6 : 4" [attr.fill]="lineColor"
            stroke="var(--bg-surface, white)" stroke-width="2" class="chart-dot"
            (mouseenter)="hoveredPoint = i" (mouseleave)="hoveredPoint = -1" />
          @if (hoveredPoint === i) {
            <rect
              [attr.x]="pt.x - 32" [attr.y]="pt.y - 30"
              width="64" height="20" rx="5"
              fill="var(--bg-elevated, #333)" opacity="0.9" />
            <text [attr.x]="pt.x" [attr.y]="pt.y - 16" text-anchor="middle" class="tooltip-text">
              {{ pt.value }}{{ suffix }}
            </text>
          }
          <text [attr.x]="pt.x" [attr.y]="height - 4" text-anchor="middle" class="dot-label">
            {{ pt.label }}
          </text>
        }
      </svg>
    </div>
  `,
  styles: [`
    .line-chart-wrap {
      width: 100%;
      padding: 16px 0 8px;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .chart-line { transition: d 0.4s; }
    .chart-dot {
      transition: r 0.2s;
      cursor: pointer;
    }
    .tooltip-text {
      font-size: 10px;
      font-weight: 700;
      fill: var(--text-on-accent, #fff);
    }
    .dot-label {
      font-size: 10px;
      font-weight: 500;
      fill: var(--text-secondary, #64748b);
    }
  `],
})
export class LineChartComponent {
  @Input() data: readonly ChartDataItem[] = [];
  @Input() height = 180;
  @Input() suffix = '';
  @Input() lineColor = '#6366f1';
  @Input() areaColor = '#6366f1';

  hoveredPoint = -1;
  readonly width = 400;
  readonly padding = 35;
  readonly bottomPadding = 20;

  get maxValue(): number {
    return Math.max(...this.data.map(d => d.value), 1);
  }

  get points(): readonly { x: number; y: number; label: string; value: number }[] {
    const count = this.data.length;
    if (count === 0) return [];

    const chartW = this.width - this.padding - 10;
    const chartH = this.height - this.padding - this.bottomPadding;
    const step = count > 1 ? chartW / (count - 1) : chartW;

    return this.data.map((d, i) => ({
      x: this.padding + step * i,
      y: this.padding + chartH * (1 - d.value / this.maxValue),
      label: d.label,
      value: d.value,
    }));
  }

  get linePath(): string {
    return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  get areaPath(): string {
    const pts = this.points;
    if (pts.length === 0) return '';
    const bottom = this.height - this.bottomPadding;
    return `${this.linePath} L ${pts[pts.length - 1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  }

  get gridLines(): readonly number[] {
    const chartH = this.height - this.padding - this.bottomPadding;
    return [0, 0.25, 0.5, 0.75, 1].map(frac => this.padding + chartH * frac);
  }
}

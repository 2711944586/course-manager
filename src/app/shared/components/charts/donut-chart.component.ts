import { Component, Input } from '@angular/core';
import { ChartDataItem } from './chart.model';

interface DonutSlice {
  readonly label: string;
  readonly value: number;
  readonly percent: number;
  readonly color: string;
  readonly startAngle: number;
  readonly endAngle: number;
  readonly path: string;
  readonly labelX: number;
  readonly labelY: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <div class="donut-chart-wrap">
      <div class="donut-svg-container">
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          @for (slice of slices; track slice.label) {
            <path
              [attr.d]="slice.path"
              [attr.fill]="slice.color"
              class="donut-slice"
            />
          }
          <circle cx="100" cy="100" r="40" [attr.fill]="centerFill" />
          <text x="100" y="96" text-anchor="middle" class="center-value">{{ total }}</text>
          <text x="100" y="112" text-anchor="middle" class="center-label">{{ centerLabel }}</text>
        </svg>
      </div>
      <div class="legend">
        @for (slice of slices; track slice.label) {
          <div class="legend-item">
            <span class="legend-dot" [style.background]="slice.color"></span>
            <span class="legend-text">{{ slice.label }}</span>
            <span class="legend-value">{{ slice.value }} ({{ slice.percent }}%)</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .donut-chart-wrap {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 0 8px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .donut-svg-container {
      width: 180px;
      flex-shrink: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .donut-slice {
      transition: opacity 0.25s, filter 0.25s;
      cursor: pointer;
      filter: saturate(0.9);
    }
    .donut-slice:hover {
      opacity: 0.85;
      filter: saturate(1.2) brightness(1.05);
    }
    .center-value {
      font-size: 24px;
      font-weight: 800;
      fill: var(--text-primary, #1e293b);
      letter-spacing: -0.02em;
    }
    .center-label {
      font-size: 10px;
      font-weight: 500;
      fill: var(--text-secondary, #64748b);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 120px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.82rem;
      padding: 4px 0;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .legend-text {
      color: var(--text-primary, #1e293b);
      flex: 1;
      font-weight: 500;
    }
    .legend-value {
      color: var(--text-secondary, #64748b);
      white-space: nowrap;
      font-size: 0.78rem;
      font-weight: 600;
    }
  `],
})
export class DonutChartComponent {
  @Input() data: readonly ChartDataItem[] = [];
  @Input() centerLabel = '总计';
  @Input() centerFill = 'var(--bg-surface, #fff)';

  readonly defaultColors = ['#0070f3', '#7c66dc', '#f5a623', '#e5484d', '#0ea371', '#ec4899', '#0091ff', '#84cc16'];

  get total(): number {
    return this.data.reduce((sum, d) => sum + d.value, 0);
  }

  get slices(): readonly DonutSlice[] {
    const total = this.total || 1;
    const result: DonutSlice[] = [];
    let currentAngle = -90;

    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      const percent = Math.round((item.value / total) * 100);
      const angleSpan = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;

      const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
      const labelRadius = 85;

      result.push({
        label: item.label,
        value: item.value,
        percent,
        color: item.color || this.defaultColors[i % this.defaultColors.length],
        startAngle,
        endAngle,
        path: this.describeArc(100, 100, 70, 40, startAngle, endAngle),
        labelX: 100 + labelRadius * Math.cos(midAngle),
        labelY: 100 + labelRadius * Math.sin(midAngle),
      });

      currentAngle = endAngle;
    }

    return result;
  }

  private describeArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
    const clampedEnd = Math.min(endAngle, startAngle + 359.99);
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (clampedEnd * Math.PI) / 180;

    const outerStartX = cx + outerR * Math.cos(startRad);
    const outerStartY = cy + outerR * Math.sin(startRad);
    const outerEndX = cx + outerR * Math.cos(endRad);
    const outerEndY = cy + outerR * Math.sin(endRad);

    const innerStartX = cx + innerR * Math.cos(endRad);
    const innerStartY = cy + innerR * Math.sin(endRad);
    const innerEndX = cx + innerR * Math.cos(startRad);
    const innerEndY = cy + innerR * Math.sin(startRad);

    const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;

    return [
      `M ${outerStartX} ${outerStartY}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEndX} ${outerEndY}`,
      `L ${innerStartX} ${innerStartY}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}`,
      'Z',
    ].join(' ');
  }
}

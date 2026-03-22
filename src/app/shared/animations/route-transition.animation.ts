import { animate, query, style, transition, trigger } from '@angular/animations';

export const routeTransitionAnimation = trigger('routeTransition', [
  transition('* <=> *', [
    query(
      ':leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          pointerEvents: 'none',
        }),
      ],
      { optional: true },
    ),
    query(
      ':enter',
      [
        style({
          position: 'relative',
          display: 'block',
          opacity: 0,
          transform: 'translateY(14px) scale(0.995)',
          filter: 'blur(4px)',
        }),
      ],
      { optional: true },
    ),
    query(
      ':leave',
      [
        animate(
          '220ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({
            opacity: 0,
            transform: 'translateY(-8px) scale(0.996)',
            filter: 'blur(2px)',
          }),
        ),
      ],
      { optional: true },
    ),
    query(
      ':enter',
      [
        animate(
          '340ms 60ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)',
          }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);

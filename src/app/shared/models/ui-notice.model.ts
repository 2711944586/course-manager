export type UiNoticeType = 'success' | 'error' | 'info';

export interface UiNotice {
  readonly type: UiNoticeType;
  readonly text: string;
}

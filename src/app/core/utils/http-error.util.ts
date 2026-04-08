import { HttpErrorResponse } from '@angular/common/http';

function extractDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const joined = detail
      .map(item => extractDetail(item))
      .filter((item): item is string => Boolean(item))
      .join('；');

    return joined || null;
  }

  if (detail && typeof detail === 'object') {
    const typedDetail = detail as Record<string, unknown>;
    const rawMsg = typedDetail['msg'];
    if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
      return rawMsg.trim();
    }

    const rawMessage = typedDetail['message'];
    if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
      return rawMessage.trim();
    }
  }

  return null;
}

export function extractHttpErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpErrorResponse) {
    const responseMessage = extractDetail(error.error?.detail) ?? extractDetail(error.error) ?? error.message;
    if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
      return responseMessage.trim();
    }

    return fallbackMessage;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return fallbackMessage;
}

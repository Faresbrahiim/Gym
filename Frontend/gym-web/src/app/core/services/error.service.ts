import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do this.",
  404: 'The requested resource was not found.',
  409: 'This already exists.',
  422: 'Validation failed. Please check your input.',
};

@Injectable({ providedIn: 'root' })
export class ErrorService {

  extractMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      if (error instanceof Error) return error.message;
      return 'Something went wrong. Please try again.';
    }

    // Try structured backend body first
    const body = error.error;
    if (typeof body?.message === 'string' && body.message.trim()) {
      return body.message.trim();
    }
    if (Array.isArray(body?.errors) && typeof body.errors[0] === 'string') {
      return body.errors[0];
    }

    // Status-code fallback
    if (STATUS_MESSAGES[error.status]) {
      return STATUS_MESSAGES[error.status];
    }
    if (error.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }

    return 'Something went wrong. Please try again.';
  }
}

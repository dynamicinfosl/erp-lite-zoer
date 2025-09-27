import { NextResponse } from 'next/server';

type Handler = (...args: unknown[]) => void;

const originalConsoleError = console.error;
let handlersConfigured = false;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return 'Erro inesperado';
  }
}

export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined' || handlersConfigured) {
    return;
  }

  const consoleHandler: Handler = (...args) => {
    originalConsoleError(...args);
  };

  console.error = consoleHandler as typeof console.error;

  window.addEventListener('error', (event) => {
    consoleHandler('Erro global capturado:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    consoleHandler('Promise rejeitada não tratada:', event.reason);
  });

  handlersConfigured = true;
}

export function handleError(error: unknown) {
  console.error('Erro capturado pelo middleware:', error);
  return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
}


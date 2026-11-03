import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AuthCredentials, MobileSession } from '../api/auth';
import {
  formSchema,
  requestErrorMessage,
  serverFieldMessage,
  type AuthMode,
  type FormValues,
} from './form';

export interface AuthFormWorkflowOptions {
  mode: AuthMode;
  onSubmit: (credentials: AuthCredentials) => Promise<MobileSession>;
  onAuthenticated: (session: MobileSession) => void | Promise<void>;
}

export function useAuthFormWorkflow(options: AuthFormWorkflowOptions) {
  const { mode, onSubmit, onAuthenticated } = options;
  const pending = useRef(false);
  const [requestError, setRequestError] = useState('');
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(mode)),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  function acquireSubmissionLock(): boolean {
    if (pending.current) return false;
    pending.current = true;
    return true;
  }

  function releaseSubmissionLock(): void {
    pending.current = false;
  }

  function clearRequestError(): void {
    setRequestError('');
  }

  function beginSubmission(): boolean {
    if (!acquireSubmissionLock()) return false;
    clearRequestError();
    return true;
  }

  function clearPasswordFields(): void {
    form.setValue('password', '');
    form.setValue('confirmPassword', '');
  }

  function showRequestError(error: unknown): void {
    setRequestError(requestErrorMessage(error));
  }

  function showServerFieldErrors(error: unknown): void {
    for (const field of ['email', 'password'] as const) {
      const message = serverFieldMessage(error, field);
      if (message) form.setError(field, { type: 'server', message });
    }
  }

  function showSubmissionError(error: unknown): void {
    showRequestError(error);
    showServerFieldErrors(error);
    clearPasswordFields();
  }

  function requestSession(values: FormValues): Promise<MobileSession> {
    return onSubmit({ email: values.email, password: values.password });
  }

  async function completeAuthentication(session: MobileSession): Promise<void> {
    await onAuthenticated(session);
  }

  async function submitValidatedCredentials(values: FormValues): Promise<void> {
    if (!beginSubmission()) return;
    try {
      const session = await requestSession(values);
      await completeAuthentication(session);
    } catch (error) {
      showSubmissionError(error);
    } finally {
      releaseSubmissionLock();
    }
  }

  return {
    control: form.control,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    requestError,
    submit: form.handleSubmit(submitValidatedCredentials),
  };
}

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from './login-form';

const mockSignIn = vi.fn();
const mockGet = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>(
    'next/navigation',
  );

  return {
    ...actual,
    useSearchParams: () => ({
      get: mockGet,
    }),
  };
});

describe('LoginForm', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost/',
      },
    });
  });

  beforeEach(() => {
    mockSignIn.mockReset();
    mockGet.mockReset();
    mockGet.mockReturnValue('/admin');
    window.location.href = 'http://localhost/';
  });

  it('shows validation messages when the form is incomplete', async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('submits credentials through Auth.js', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({
      error: undefined,
      url: '/admin',
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email/i),
      'admin@trainovations.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'Trainovations123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'admin@trainovations.com',
        password: 'Trainovations123!',
        redirect: false,
        callbackUrl: '/admin',
      });
    });

    expect(window.location.href).toBe('/admin');
  });

  it('shows a form-level error when Auth.js rejects the credentials', async () => {
    const user = userEvent.setup();

    mockSignIn.mockResolvedValue({
      error: 'CredentialsSignin',
      url: null,
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email/i),
      'admin@trainovations.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
  });

  it('defaults to the shared workspace destination when no callback is provided', async () => {
    const user = userEvent.setup();

    mockGet.mockReset();
    mockGet.mockImplementation(() => null);
    mockSignIn.mockResolvedValue({
      error: undefined,
      url: '/workspace',
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/email/i),
      'jay.jones@trainovations.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'Trainovations123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('callbackUrl');
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'jay.jones@trainovations.com',
        password: 'Trainovations123!',
        redirect: false,
        callbackUrl: '/workspace',
      });
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';
import { auth, ensureUserDocument } from '../firebase';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginScreen } from '../screens/LoginScreen';

type AuthCb = (u: User | null) => void;
let authCb: AuthCb | null = null;

/** onAuthStateChanged stub: captures the callback so each test decides when/what Firebase "reports". */
const captureAuth = () => {
    authCb = null;
    vi.mocked(onAuthStateChanged).mockImplementation(((_a: unknown, cb: AuthCb) => {
        authCb = cb;
        return () => { };
    }) as never);
};
const fireAuth = (u: User | null) => act(() => { authCb!(u); });
const fakeUser = (extra: Partial<User> = {}) => ({ uid: 'u1', isAnonymous: false, ...extra }) as User;

beforeEach(() => {
    captureAuth();
    vi.mocked(ensureUserDocument).mockReset().mockResolvedValue(undefined);
    vi.mocked(signInWithEmailAndPassword).mockClear();
});

describe('Email sanitization (LoginScreen)', () => {
    const renderLogin = () =>
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        );

    it('trims trailing whitespace before calling Firebase (prevents auth/argument-error)', async () => {
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'user@test.com ' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret12' } });
        await act(async () => { fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!); });

        expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'user@test.com', 'secret12');
    });

    it('trims leading and trailing whitespace', async () => {
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: '  a@b.co  ' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pw' } });
        await act(async () => { fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!); });
        expect(vi.mocked(signInWithEmailAndPassword).mock.calls[0][1]).toBe('a@b.co');
    });

    it('shows the error message when sign-in fails', async () => {
        vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(new Error('Wrong password'));
        vi.spyOn(console, 'error').mockImplementation(() => { });
        renderLogin();
        fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'x@y.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'bad' } });
        await act(async () => { fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!); });
        expect(screen.getByText('Wrong password')).toBeInTheDocument();
    });
});

describe('AuthContext cold start', () => {
    const renderProvider = () =>
        render(
            <AuthProvider>
                <div>APP CONTENT</div>
            </AuthProvider>
        );

    it('renders nothing only until Firebase reports auth state', () => {
        renderProvider();
        expect(screen.queryByText('APP CONTENT')).not.toBeInTheDocument();
        fireAuth(null);
        expect(screen.getByText('APP CONTENT')).toBeInTheDocument();
    });

    it('does not block on a Firestore call that never resolves (offline/slow)', () => {
        vi.mocked(ensureUserDocument).mockReturnValue(new Promise(() => { })); // hangs forever
        renderProvider();
        fireAuth(fakeUser());
        expect(screen.getByText('APP CONTENT')).toBeInTheDocument();
        expect(ensureUserDocument).toHaveBeenCalledWith('u1');
    });

    it('does not crash or block when ensureUserDocument rejects', async () => {
        vi.mocked(ensureUserDocument).mockRejectedValue(new Error('offline'));
        renderProvider();
        await act(async () => { authCb!(fakeUser()); });
        expect(screen.getByText('APP CONTENT')).toBeInTheDocument();
    });

    it('signed-out users do not trigger a Firestore write', () => {
        renderProvider();
        fireAuth(null);
        expect(ensureUserDocument).not.toHaveBeenCalled();
    });
});

describe('Protected routes', () => {
    const renderRoutes = () =>
        render(
            <MemoryRouter initialEntries={['/profile']}>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<div>HOME PAGE</div>} />
                        <Route path="/profile" element={<ProtectedRoute><div>PRIVATE PAGE</div></ProtectedRoute>} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        );

    it('unauthenticated users are redirected away from protected pages', () => {
        renderRoutes();
        fireAuth(null);
        expect(screen.getByText('HOME PAGE')).toBeInTheDocument();
        expect(screen.queryByText('PRIVATE PAGE')).not.toBeInTheDocument();
    });

    it('anonymous users are redirected too', () => {
        renderRoutes();
        fireAuth(fakeUser({ isAnonymous: true }));
        expect(screen.getByText('HOME PAGE')).toBeInTheDocument();
    });

    it('signed-in users can see protected pages', () => {
        renderRoutes();
        fireAuth(fakeUser());
        expect(screen.getByText('PRIVATE PAGE')).toBeInTheDocument();
    });
});

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// ---- External module mocks (no network, deterministic) ----
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/analytics', () => ({
    getAnalytics: vi.fn(() => ({})),
    logEvent: vi.fn(),
}));

vi.mock('firebase/auth', () => {
    class GoogleAuthProvider { }
    return {
        getAuth: vi.fn(() => ({ currentUser: null })),
        onAuthStateChanged: vi.fn(() => () => { }),
        signInWithEmailAndPassword: vi.fn(() => Promise.resolve({})),
        createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: {} })),
        signInWithPopup: vi.fn(() => Promise.resolve({})),
        signOut: vi.fn(() => Promise.resolve()),
        updateProfile: vi.fn(() => Promise.resolve()),
        GoogleAuthProvider,
    };
});

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
    updateDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'session-id' })),
    increment: vi.fn((n: number) => n),
    serverTimestamp: vi.fn(() => 0),
    initializeFirestore: vi.fn(() => ({})),
    getFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(() => ({})),
    persistentMultipleTabManager: vi.fn(() => ({})),
}));

// App's own firebase wrapper (keeps firebase.ts from initialising anything)
vi.mock('../firebase', () => ({
    auth: { currentUser: null },
    db: {},
    analytics: {},
    saveLevelProgress: vi.fn(() => Promise.resolve()),
    getUserProgress: vi.fn(() => Promise.resolve(null)),
    ensureUserDocument: vi.fn(() => Promise.resolve()),
    saveSessionAnalytics: vi.fn(() => Promise.resolve('session-id')),
    updateSessionAnalytics: vi.fn(() => Promise.resolve()),
}));

// ---- JSDOM gaps ----
if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { },
            removeListener: () => { },
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
        }),
    });
}

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks(); // restores Math.random spies etc.
});

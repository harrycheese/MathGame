import { describe, it, expect, beforeEach, vi } from 'vitest';

// These tests load the REAL src/firebase.ts (the global setup replaces it with a fake).
// Only the Firebase SDK packages underneath are mocked, so we can see how the app wires them up.
const AUTH = { sentinel: 'auth-instance' };
const initializeAuth = vi.fn(() => ({ sentinel: 'custom-auth' }));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => AUTH),
    initializeAuth,
    indexedDBLocalPersistence: {},
    browserLocalPersistence: {},
}));

const loadReal = async () => {
    vi.resetModules();
    return vi.importActual<typeof import('../firebase')>('../firebase');
};

describe('real firebase.ts wiring', () => {
    beforeEach(() => {
        initializeAuth.mockClear();
    });

    it('exports the standard getAuth(app) instance (custom initializeAuth persistence broke sign-in/up)', async () => {
        const { getAuth } = await import('firebase/auth');
        const { initializeApp } = await import('firebase/app');
        const mod = await loadReal();

        expect(initializeApp).toHaveBeenCalled();
        expect(getAuth).toHaveBeenCalledWith(vi.mocked(initializeApp).mock.results.at(-1)!.value);
        expect(mod.auth).toBe(AUTH);
        expect(initializeAuth).not.toHaveBeenCalled();
    });

    it('does not crash at import if Firestore persistence fails to initialise', async () => {
        const fs = await import('firebase/firestore');
        vi.mocked(fs.initializeFirestore).mockImplementationOnce(() => { throw new Error('IndexedDB locked'); });
        const mod = await loadReal();
        expect(fs.getFirestore).toHaveBeenCalled();
        expect(mod.db).toBeDefined();
    });
});

describe('real firebase.ts data helpers', () => {
    it('ensureUserDocument creates a doc only when none exists', async () => {
        const fs = await import('firebase/firestore');
        const { ensureUserDocument } = await loadReal();

        vi.mocked(fs.setDoc).mockClear();
        vi.mocked(fs.getDoc).mockResolvedValueOnce({ exists: () => true } as never);
        await ensureUserDocument('u1');
        expect(fs.setDoc).not.toHaveBeenCalled(); // never overwrite existing progress

        vi.mocked(fs.getDoc).mockResolvedValueOnce({ exists: () => false } as never);
        await ensureUserDocument('u1');
        expect(fs.setDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ currentLevel: 1, totalStars: 0 }));
    });

    it('getUserProgress returns null when offline instead of throwing', async () => {
        const fs = await import('firebase/firestore');
        const { getUserProgress } = await loadReal();
        vi.mocked(fs.getDoc).mockRejectedValueOnce(new Error('offline'));
        await expect(getUserProgress('u1')).resolves.toBeNull();
    });

    it('saveLevelProgress unlocks the next level only on a new best of the latest level', async () => {
        const fs = await import('firebase/firestore');
        const { saveLevelProgress } = await loadReal();
        vi.mocked(fs.updateDoc).mockClear();

        vi.mocked(fs.getDoc).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ currentLevel: 3, levelStats: { 3: { score: 100, stars: 1 } } }),
        } as never);
        await saveLevelProgress('u1', 3, { score: 200, stars: 2, completedAt: 1 });
        expect(fs.updateDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ currentLevel: 4 }));

        vi.mocked(fs.updateDoc).mockClear();
        vi.mocked(fs.getDoc).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ currentLevel: 3, levelStats: { 3: { score: 300, stars: 3 } } }),
        } as never);
        await saveLevelProgress('u1', 3, { score: 50, stars: 1, completedAt: 2 }); // worse run
        expect(fs.updateDoc).not.toHaveBeenCalled();
    });
});

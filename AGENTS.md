# Project rules (Six-7 / mathGame)

These rules apply to every developer and AI agent working in this repo.

## Testing

1. **Run `npm test` before every Firebase deployment.** `firebase.json` has a hosting `predeploy`
   hook that runs it automatically, and the deploy aborts if any test fails. Never bypass it
   (no `--only` tricks or editing the hook) to ship a build.
2. **Every new feature or bug fix ships with tests** in `src/__tests__/` in the same change.
   - Game logic / hooks: use the harness in `src/test/engineHarness.ts` (seeded randomness, scripted boards).
   - Screens / contexts: React Testing Library.
   - Bug fix: first write a test that fails on the bug, then fix it.
3. **Tests must be deterministic.** No network, no live Firebase, no real timers or unseeded
   `Math.random`. Firebase SDKs and `canvas-confetti` are mocked in `src/test/setup.ts`.
4. **`src/firebase.ts` is replaced by a fake in most tests.** Changes to it must be covered by
   `src/__tests__/firebaseWiring.test.ts`, which loads the real file.
5. Confirm a new test is meaningful: temporarily break the behaviour it covers and check it fails.
   Restore the code afterwards.

## Commands

- `npm test`: run all tests once (compact output, a few seconds).
- `npm run test:watch`: watch mode while developing.
- `npm run build`: typecheck (`tsc -b`) and production build.

## Branches

- `feature/twa-app-launch` backs the Play Store release. Do not modify it while a store review is pending.


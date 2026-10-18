# fix: `yarn test` fails because tsconfig.test.json is missing

Issue: #111

## Cause
The `test` script (added in 0154c44) points `TS_NODE_PROJECT` at `tsconfig.test.json`, which was never committed. The only test is plain ESM (`tests/test_data.mjs`) and needs no ts-node. CI never ran `yarn test`.

## Fix
- `test`: `node --test ./tests/test_*.mjs`.
- `build.yml`: run `yarn test` after build.
- CLAUDE.md: update the `yarn test` description.

## Out of scope
- Removing the now-unused `ts-node` devDependency (proposed separately).
- Replacing the placeholder test with real tests.

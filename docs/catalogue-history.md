# Catalogue history

Compute Ledger keeps catalogue history in Git and publishes the resulting JSON under `public/data/history/`. No database or application backend is required.

## Layout

- `snapshots/<id>.json`: immutable, complete catalogue snapshots.
- `changes/<id>.json`: the deterministic difference from the preceding snapshot.
- `index.json`: ordered snapshot metadata and paths for consumers.

A snapshot contains a version, capture timestamp, SHA-256 content hash and the complete validated catalogue. Snapshot IDs include a UTC timestamp and a short hash, so multiple genuine updates on the same day can be retained.

## Capture workflow

`.github/workflows/snapshot-catalogue.yml` runs when the catalogue or its validation/history implementation changes, on a daily schedule as a safety net, and on manual dispatch. It validates the catalogue with the existing Zod schema and checks cross-record references before writing any history.

If the current catalogue has the same canonical content hash as the latest snapshot, the workflow does nothing. Otherwise it writes a new immutable snapshot, a change set and the updated index, then opens or updates a pull request containing only the generated history files. History is reviewed and merged through the repository's protected-branch process; the workflow never pushes directly to `main` or edits/replaces `catalogue.json`. It dispatches the repository validation workflow against the PR branch so the required `validate` check can run for the generated commit.

The first successful run creates a baseline snapshot with an empty change set. Later runs compare against the preceding snapshot.

### Repository Actions permission

For unattended pull-request creation, enable **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**. The workflow already requests `contents: write`, `pull-requests: write` and `actions: write`. If the repository-level setting is disabled, GitHub Actions can push the generated branch but GitHub rejects the pull-request creation request. In that case, a maintainer must open the PR manually or enable the setting before the next scheduled/manual run.


## Deterministic comparisons

Object keys and unordered array values are canonicalised before hashing and comparison. Collection records are matched by stable `id`, not by array position. Changes are emitted in a stable order and represented as:

- `added`: a new record, including its full new value.
- `removed`: a record explicitly removed from the current catalogue, including its last recorded value.
- `updated`: a record with one or more field-level differences.

Changes to catalogue `updatedAt` and record `accessedAt` / `observedAt` timestamps are retained in snapshots but do not by themselves create user-visible change events. A substantive change to a price, usage policy, model capability, lifecycle state, source URL or other field is recorded.

## Corrections, missing observations and removals

Snapshots are append-only. Correct a mistake in the current catalogue through the normal reviewed data change; the next snapshot records the corrected value as a new update. Do not rewrite old snapshots to make history appear as if the correction had always been present.

A missing or unavailable source is not evidence that a catalogue item has disappeared. Keep the last verified record and record the collection problem separately. A `removed` event means a record was deliberately removed from the catalogue after review, not merely that a source could not be reached. This distinction is especially important when #10 automated collectors are added.

## Retention and integrity

Snapshots are retained indefinitely in Git for now. Full snapshots are small, straightforward to inspect and provide a robust audit trail; Git stores repeated content efficiently. Revisit retention only if repository size or history query performance becomes a real concern.

Validation runs before history is written. If parsing, schema validation or relationship validation fails, the workflow exits without creating a history pull request. The current catalogue and last-known-good history remain untouched.

## Local use

Run the same capture process locally with Node.js 22 and installed dependencies:

```bash
npm install
npm run history:snapshot
```

The command is idempotent: running it again without a substantive catalogue content change creates no additional snapshot. The generated history files can be reviewed with normal Git diff tools.

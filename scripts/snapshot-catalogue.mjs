import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { datasetSchema } from "../src/data/schema.ts";
import {
  createChangeSet,
  hashCatalogue,
  validateCatalogueRelationships,
} from "./lib/catalogue-history.mjs";

const cataloguePath = "public/data/catalogue.json";
const snapshotsDirectory = "public/data/history/snapshots";
const changesDirectory = "public/data/history/changes";
const indexPath = "public/data/history/index.json";

function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listSnapshots() {
  try {
    const files = (await readdir(snapshotsDirectory))
      .filter((file) => file.endsWith(".json"))
      .sort();
    return Promise.all(files.map(async (file) => ({
      file,
      snapshot: await readJson(join(snapshotsDirectory, file)),
    })));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const rawCatalogue = await readJson(cataloguePath);
const validatedCatalogue = datasetSchema.parse(rawCatalogue);
validateCatalogueRelationships(validatedCatalogue);

// Keep the original payload in history so fields added ahead of the app schema
// are not silently stripped from an otherwise valid snapshot.
const catalogue = rawCatalogue;
const contentHash = hashCatalogue(catalogue);
const existingSnapshots = await listSnapshots();
const previousEntry = existingSnapshots.at(-1);

if (previousEntry?.snapshot.contentHash === contentHash) {
  console.log(`Catalogue unchanged (${contentHash.slice(0, 12)}); no snapshot created.`);
  process.exit(0);
}

const capturedAt = new Date().toISOString();
const snapshotId = `${capturedAt.replace(/[:.]/g, "-")}-${contentHash.slice(0, 12)}`;
const previousCatalogue = previousEntry?.snapshot.catalogue ?? null;
const changes = createChangeSet(previousCatalogue, catalogue);
const snapshotPath = `data/history/snapshots/${snapshotId}.json`;
const changesPath = `data/history/changes/${snapshotId}.json`;

const snapshot = {
  snapshotVersion: 1,
  id: snapshotId,
  capturedAt,
  contentHash,
  changeCount: changes.length,
  catalogue,
};
const changeSet = {
  changeSetVersion: 1,
  id: snapshotId,
  generatedAt: capturedAt,
  fromSnapshot: previousEntry?.snapshot.id ?? null,
  toSnapshot: snapshotId,
  changes,
};

await mkdir(snapshotsDirectory, { recursive: true });
await mkdir(changesDirectory, { recursive: true });
await writeFile(join(snapshotsDirectory, `${snapshotId}.json`), formatJson(snapshot));
await writeFile(join(changesDirectory, `${snapshotId}.json`), formatJson(changeSet));

const historyEntries = existingSnapshots.map(({ snapshot: item }) => ({
  id: item.id,
  capturedAt: item.capturedAt,
  contentHash: item.contentHash,
  snapshot: `data/history/snapshots/${item.id}.json`,
  changes: `data/history/changes/${item.id}.json`,
  changeCount: item.changeCount ?? null,
}));
historyEntries.push({
  id: snapshotId,
  capturedAt,
  contentHash,
  snapshot: snapshotPath,
  changes: changesPath,
  changeCount: changes.length,
});

const index = {
  historyVersion: 1,
  generatedAt: capturedAt,
  snapshots: historyEntries,
};
await mkdir(dirname(indexPath), { recursive: true });
await writeFile(indexPath, formatJson(index));

console.log(
  previousEntry
    ? `Created snapshot ${snapshotId} with ${changes.length} substantive change(s).`
    : `Created initial baseline snapshot ${snapshotId}.`,
);

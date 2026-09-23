import { del, get, set } from "idb-keyval";
import type { PersistedDocument } from "./types";

const KEY = "atelier-draft-v1";

export async function saveDraft(doc: PersistedDocument) {
  await set(KEY, { ...doc, savedAt: Date.now() });
}

export async function loadDraft(): Promise<PersistedDocument | undefined> {
  return get(KEY);
}

export async function clearDraft() {
  await del(KEY);
}

// Vendored from @decocms/apps (blog/core/records.ts) by @decocms/blocks-migrate. It's your code now.
import type { Client } from "@decocms/blocks";
import { requestState } from "../../../request-state.server";

/**
 * Every saved block of `type` (the v7 collection loaders, such as
 * "blog/loaders/Blogpost.ts"), as saved, with the nested value at `accessor`
 * and an `id` taken from the entry's name after `path`.
 *
 * The collection is read the way the SDK documents collections
 * (/next/content-shapes#collections): `client.entries(type)` lists the
 * documents from the content index (no body fetched), then each one is read
 * with `resolve(name, { run: false })`, as saved: nothing inside runs.
 * Never `client.list()`: it was removed (it fetched every block of the type
 * per call) and throws.
 *
 * The bodies are content-addressed and the SDK keeps them per isolate by
 * hash, so a document fetches once per isolate until it changes. The records
 * are also kept here per revision (the release, or a draft over it), so the
 * requests of one revision share one read of the collection.
 */
export async function getRecordsByPath<T>(type: string, path: string, accessor: string): Promise<T[]> {
	const client = requestState().client;
	const values = await savedCollection(client, type);
	const results: T[] = [];

	for (const { name, value } of values) {
		const record = value[accessor] as T | undefined;
		if (!record) continue;

		// The id is the entry's name after `path` (v7 read the `name` field
		// saved content stores; the index carries the same name). A record
		// saved under another prefix gets its `slug`.
		const id =
			(((value.name as string | undefined) ?? name).split(path)[1]?.replace("/", "") || undefined) ??
			((record as { slug?: unknown }).slug as string | undefined);

		results.push({ ...record, id } as T);
	}

	return results;
}

interface Saved {
	name: string;
	value: Record<string, unknown>;
}

/** Revisions kept: the release and the one before it (a publish), plus a draft being previewed. */
const KEPT = 4;
const memo = new Map<string, Promise<Saved[]>>();

/**
 * The saved documents of `type` for the client's revision, read once per revision. The key is the
 * content the client pinned (`revision()`: a draft's includes the release under it, so a publish
 * shows in an open preview) and its version (a draft's pointer moves on every save).
 */
async function savedCollection(client: Client, type: string): Promise<Saved[]> {
	const key = `${await client.revision()}\u0000${client.version ?? ""}\u0000${type}`;
	let read = memo.get(key);
	if (!read) {
		read = readCollection(client, type);
		memo.set(key, read);
		// A failed read isn't kept: the next request tries again.
		read.catch(() => memo.delete(key));
		while (memo.size > KEPT * 3) memo.delete(memo.keys().next().value as string);
	}
	return read;
}

async function readCollection(client: Client, type: string): Promise<Saved[]> {
	const [entries, error] = await client.entries(type);
	if (error) throw error;
	// Every document starts downloading at once (one wave), each body once per isolate.
	return Promise.all(
		entries.map(async ({ name }) => {
			const [value, readError] = await client.resolve<Record<string, unknown>>(name, { run: false });
			if (readError) throw readError;
			return { name, value: value ?? {} };
		}),
	);
}

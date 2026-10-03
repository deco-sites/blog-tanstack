// Vendored from @decocms/apps (blog/core/records.ts) by @decocms/blocks-migrate. It's your code now.
import { requestState } from "../../../request-state.server";

/**
 * Every saved block of `type` (the v7 collection loaders, such as
 * "blog/loaders/Blogpost.ts"), as saved, with the nested value at `accessor`
 * and an `id` taken from the entry's name after `path`.
 *
 * v7 scanned the decofile by key prefix; here the request's client lists the
 * type (aliases included), as saved: nothing inside runs.
 */
export async function getRecordsByPath<T>(type: string, path: string, accessor: string): Promise<T[]> {
	const [entries, error] = await requestState().client.list<Record<string, unknown>>(type);
	if (error) throw error;
	const results: T[] = [];

	for (const value of entries) {
		const record = value[accessor] as T | undefined;
		if (!record) continue;

		const id = (value.name as string | undefined)?.split(path)[1]?.replace("/", "");

		results.push({ ...record, id } as T);
	}

	return results;
}

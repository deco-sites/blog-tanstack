/**
 * The header that carries a page's status (a CMS page can render as a 404) to
 * the worker entry, which turns it into the document's status. Start's route
 * `headers` reach the document response; a status set inside the server
 * function doesn't.
 */
export const PAGE_STATUS_HEADER = "x-page-status";

import "./setup";
import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { createDecoWorkerEntry } from "@decocms/start/sdk/workerEntry";
import { detectDevice } from "@decocms/start/sdk/useDevice";
import {
  handleMeta,
  handleDecofileRead,
  handleDecofileReload,
  handleRender,
  corsHeaders,
} from "@decocms/start/admin";

const serverEntry = createServerEntry({ fetch: handler.fetch });

const CSP_DIRECTIVES = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com data:",
];

export default createDecoWorkerEntry(serverEntry, {
  observability: false,
  admin: {
    handleMeta,
    handleDecofileRead,
    handleDecofileReload,
    handleRender,
    corsHeaders,
  },
  csp: CSP_DIRECTIVES,
  buildSegment: (request) => {
    const device = detectDevice(request.headers.get("user-agent") ?? "");
    return { device };
  },
  proxyHandler: async (_request, _url) => null,
});

/**
 * Conservative ambient types for the experimental WebMCP / Model Context API.
 *
 * The platform surface is still evolving (document.modelContext vs legacy
 * navigator.modelContext; AbortSignal unregistration). Keep these declarations
 * structural and optional so the site builds without a polyfill or npm types package.
 */

type WebMcpJsonSchema = {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
};

type WebMcpToolAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
};

type WebMcpToolExecuteCallback = (
  input: Record<string, unknown>,
) => unknown | Promise<unknown>;

type WebMcpToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: WebMcpJsonSchema;
  execute: WebMcpToolExecuteCallback;
  annotations?: WebMcpToolAnnotations;
};

type WebMcpRegisterToolOptions = {
  signal?: AbortSignal;
  exposedTo?: string[];
};

type WebMcpRegisteredTool = {
  name: string;
  title?: string | null;
  description?: string;
  inputSchema?: string | WebMcpJsonSchema;
  origin?: string;
  annotations?: WebMcpToolAnnotations | null;
  window?: Window;
};

type WebMcpModelContext = EventTarget & {
  registerTool: (
    tool: WebMcpToolDefinition,
    options?: WebMcpRegisterToolOptions,
  ) => void | Promise<void>;
  getTools?: (options?: { fromOrigins?: string[] }) => Promise<WebMcpRegisteredTool[]>;
  /** Legacy / transitional; prefer AbortSignal unregistration. */
  unregisterTool?: (name: string) => void | Promise<void>;
};

interface Document {
  /** Current WebMCP entry point (Chromium preview / draft). */
  readonly modelContext?: WebMcpModelContext;
}

interface Navigator {
  /**
   * Deprecated compatibility alias in some Chromium builds.
   * Prefer document.modelContext when available.
   */
  readonly modelContext?: WebMcpModelContext;
}

export interface RendererDevBootstrapContext {
  manifestPath: string;
  repoRoot: string;
}

export function resolveRendererDevBootstrapContext(startDir?: string): RendererDevBootstrapContext;
export const resolveDevBootstrapContext: typeof resolveRendererDevBootstrapContext;
export function runRendererDevWithBootstrapCli(argv?: string[]): void;

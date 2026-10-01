import type { Backend } from '../backend/client.js';
import type { PortfolioBrand } from '../portfolio.js';
export function mountAdmin(root: HTMLElement, backend: Backend | null, options?: { preview?: boolean; brands?: PortfolioBrand[]; assets?: Record<string, string> }): () => void;

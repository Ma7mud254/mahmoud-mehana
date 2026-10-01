export interface PortfolioBrand {
  id: string;
  is_visible?: boolean;
  link_enabled?: boolean;
  position?: number;
  name: string;
  logo: string | null;
  category: string;
  url: string | null;
  featured?: boolean;
  originalLogo?: boolean;
  theme?: string;
  headline?: string;
  meta?: string;
  tags?: string[];
  description?: string;
  note?: string;
}
export interface PortfolioOptions {
  assetBase?: string;
  assets?: Record<string, string>;
  loadThree?: () => Promise<typeof import('three')>;
}
export function mountPortfolio(root: HTMLElement, brands: PortfolioBrand[], options?: PortfolioOptions): () => void;

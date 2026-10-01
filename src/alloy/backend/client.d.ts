import type { PortfolioBrand } from '../portfolio.js';
export interface ManagedBrand extends PortfolioBrand {
  position: number; is_visible: boolean; link_enabled: boolean; version: number; updated_at?: string;
}
export interface BrandInput { name: string; category: string; url: string | null; logo: string | null; position: number; is_visible: boolean; link_enabled: boolean; }
export interface Backend {
  kind: 'local' | 'supabase';
  publicBrands(): Promise<PortfolioBrand[]>;
  login(email: string, password: string): Promise<{ email: string }>;
  session(): Promise<{ email: string }>;
  logout(): Promise<unknown>;
  list(): Promise<ManagedBrand[]>;
  save(brand: BrandInput, id?: string, version?: number): Promise<ManagedBrand>;
  remove(id: string, version: number): Promise<unknown>;
  upload(blob: Blob): Promise<{ logo: string }>;
  changePassword(current: string, password: string): Promise<unknown>;
  exportData(): Promise<unknown>;
}
export function createBackend(config?: { supabaseUrl?: string; supabaseKey?: string; mode?: string }): Backend | null;

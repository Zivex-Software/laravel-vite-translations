import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { hashContent } from "../utils/hash.js";
import type { TransformCache, CacheEntry } from "../types/index.js";

const CACHE_FILE = ".vite/translations-cache.json";
const CACHE_VERSION = "3";

export class TransformCacheManager {
  private cache: TransformCache = {};
  private cacheDir: string;
  private cacheFile: string;

  constructor(root: string) {
    this.cacheDir = join(root, ".vite");
    this.cacheFile = join(root, CACHE_FILE);
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(this.cacheFile)) {
        const raw = readFileSync(this.cacheFile, "utf-8");
        this.cache = JSON.parse(raw);
      }
    } catch {
      this.cache = {};
    }
  }

  save(): void {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
      writeFileSync(this.cacheFile, JSON.stringify(this.cache, null, 2));
    } catch {
      // Silently fail on cache write errors
    }
  }

  get(filePath: string, sourceCode: string): CacheEntry | null {
    const entry = this.cache[filePath];
    if (!entry) return null;

    const hash = this.hashSource(sourceCode);
    if (entry.hash !== hash) return null;

    return entry;
  }

  set(filePath: string, sourceCode: string, namespaces: string[]): void {
    this.cache[filePath] = {
      hash: this.hashSource(sourceCode),
      namespaces,
      timestamp: Date.now(),
    };
  }

  invalidate(filePath: string): void {
    delete this.cache[filePath];
  }

  clear(): void {
    this.cache = {};
  }

  private hashSource(sourceCode: string): string {
    return hashContent(`${CACHE_VERSION}:${sourceCode}`);
  }
}

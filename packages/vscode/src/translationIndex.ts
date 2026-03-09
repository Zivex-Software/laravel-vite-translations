import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";

export interface IndexedTranslation {
  key: string;
  namespace: string;
  file: string;
  locales: string[];
  values: Map<string, string>;
}

export class TranslationIndexManager {
  private index = new Map<string, IndexedTranslation>();
  private watcher: vscode.FileSystemWatcher | undefined;
  private generatedDir: string;

  constructor(private workspaceRoot: string) {
    const config = vscode.workspace.getConfiguration("laravelViteTranslations");
    this.generatedDir = path.resolve(
      workspaceRoot,
      config.get("generatedDir", "resources/js/i18n/generated")
    );
  }

  async initialize(): Promise<void> {
    await this.buildIndex();
    this.watchForChanges();
  }

  private async buildIndex(): Promise<void> {
    this.index.clear();

    // Read translation index
    const indexPath = path.join(this.generatedDir, "translation-index.json");
    if (!fs.existsSync(indexPath)) return;

    try {
      const raw = fs.readFileSync(indexPath, "utf-8");
      const data = JSON.parse(raw) as Record<
        string,
        { namespace: string; file: string; locales: string[] }
      >;

      for (const [key, entry] of Object.entries(data)) {
        const values = new Map<string, string>();

        // Load values from locale files
        for (const locale of entry.locales) {
          const jsonPath = path.join(
            this.generatedDir,
            locale,
            `${entry.namespace}.json`
          );
          try {
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
            const subKey = key.substring(entry.namespace.length + 1);
            if (jsonData[subKey]) {
              values.set(locale, jsonData[subKey]);
            }
          } catch {
            // Skip this locale
          }
        }

        this.index.set(key, {
          key,
          namespace: entry.namespace,
          file: entry.file,
          locales: entry.locales,
          values,
        });
      }
    } catch {
      // Failed to parse index
    }
  }

  private watchForChanges(): void {
    const pattern = new vscode.RelativePattern(
      this.generatedDir,
      "**/*.json"
    );
    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.watcher.onDidChange(() => this.buildIndex());
    this.watcher.onDidCreate(() => this.buildIndex());
    this.watcher.onDidDelete(() => this.buildIndex());
  }

  getAll(): Map<string, IndexedTranslation> {
    return this.index;
  }

  get(key: string): IndexedTranslation | undefined {
    return this.index.get(key);
  }

  getKeys(): string[] {
    return [...this.index.keys()];
  }

  dispose(): void {
    this.watcher?.dispose();
  }
}

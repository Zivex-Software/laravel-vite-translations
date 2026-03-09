import * as vscode from "vscode";
import type { TranslationIndexManager } from "./translationIndex.js";

export class TranslationDiagnosticProvider {
  private collection: vscode.DiagnosticCollection;
  private disposables: vscode.Disposable[] = [];

  constructor(private indexManager: TranslationIndexManager) {
    this.collection = vscode.languages.createDiagnosticCollection(
      "laravel-vite-translations"
    );

    // Listen for document changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        this.updateDiagnostics(e.document);
      })
    );

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.updateDiagnostics(doc);
      })
    );

    // Check all open documents
    for (const doc of vscode.workspace.textDocuments) {
      this.updateDiagnostics(doc);
    }
  }

  private updateDiagnostics(document: vscode.TextDocument): void {
    if (!this.isRelevantFile(document)) {
      this.collection.delete(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const regex = /\bt\(\s*["']([^"']+)["']\s*[,)]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const key = match[1];
      const entry = this.indexManager.get(key);

      if (!entry) {
        const startPos = document.positionAt(match.index + match[0].indexOf(key));
        const endPos = document.positionAt(
          match.index + match[0].indexOf(key) + key.length
        );
        const range = new vscode.Range(startPos, endPos);

        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Unknown translation key: "${key}"`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }

    this.collection.set(document.uri, diagnostics);
  }

  private isRelevantFile(document: vscode.TextDocument): boolean {
    const ext = document.fileName.split(".").pop();
    return ["ts", "tsx", "js", "jsx", "vue", "svelte"].includes(ext || "");
  }

  dispose(): void {
    this.collection.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

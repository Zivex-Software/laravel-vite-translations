import * as vscode from "vscode";
import * as path from "node:path";
import type { TranslationIndexManager } from "./translationIndex.js";

export class TranslationDefinitionProvider implements vscode.DefinitionProvider {
  constructor(
    private indexManager: TranslationIndexManager,
    private workspaceRoot: string
  ) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Location | undefined {
    const range = this.getKeyRangeAtPosition(document, position);
    if (!range) return undefined;

    const key = document.getText(range);
    const entry = this.indexManager.get(key);
    if (!entry) return undefined;

    // Navigate to the source PHP file
    const filePath = path.resolve(this.workspaceRoot, entry.file);
    const uri = vscode.Uri.file(filePath);

    return new vscode.Location(uri, new vscode.Position(0, 0));
  }

  private getKeyRangeAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Range | undefined {
    const lineText = document.lineAt(position).text;

    // Find t("key") or t('key') around cursor
    const regex = /\bt\(\s*["']([^"']+)["']/g;
    let match;

    while ((match = regex.exec(lineText)) !== null) {
      const keyStart = match.index + match[0].indexOf(match[1]);
      const keyEnd = keyStart + match[1].length;

      if (position.character >= keyStart && position.character <= keyEnd) {
        return new vscode.Range(
          position.line,
          keyStart,
          position.line,
          keyEnd
        );
      }
    }

    return undefined;
  }
}

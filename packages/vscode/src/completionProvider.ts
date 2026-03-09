import * as vscode from "vscode";
import type { TranslationIndexManager } from "./translationIndex.js";

export class TranslationCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private indexManager: TranslationIndexManager) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Check if we're inside t("...")  or t('...')
    const tCallMatch = textBeforeCursor.match(/\bt\(\s*["']([^"']*)$/);
    if (!tCallMatch) return undefined;

    const prefix = tCallMatch[1];
    const items: vscode.CompletionItem[] = [];

    for (const [key, entry] of this.indexManager.getAll()) {
      if (prefix && !key.startsWith(prefix)) continue;

      const item = new vscode.CompletionItem(
        key,
        vscode.CompletionItemKind.Text
      );

      // Show translation value as detail
      const enValue = entry.values.get("en");
      if (enValue) {
        item.detail = enValue;
      }

      // Show all locale values in documentation
      const docs: string[] = [];
      for (const [locale, value] of entry.values) {
        docs.push(`**${locale}**: ${value}`);
      }
      item.documentation = new vscode.MarkdownString(docs.join("\n\n"));

      item.insertText = key;
      item.filterText = key;

      items.push(item);
    }

    return items;
  }
}

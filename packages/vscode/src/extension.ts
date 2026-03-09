import * as vscode from "vscode";
import { TranslationIndexManager } from "./translationIndex.js";
import { TranslationCompletionProvider } from "./completionProvider.js";
import { TranslationDiagnosticProvider } from "./diagnosticProvider.js";
import { TranslationDefinitionProvider } from "./definitionProvider.js";

let indexManager: TranslationIndexManager;
let diagnosticProvider: TranslationDiagnosticProvider;

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const root = workspaceFolder.uri.fsPath;

  // Initialize translation index
  indexManager = new TranslationIndexManager(root);
  await indexManager.initialize();

  // Register completion provider
  const completionProvider = new TranslationCompletionProvider(indexManager);
  const languages = [
    "typescript",
    "typescriptreact",
    "javascript",
    "javascriptreact",
    "vue",
    "svelte",
  ];

  for (const lang of languages) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language: lang },
        completionProvider,
        '"',
        "'"
      )
    );
  }

  // Register diagnostics
  diagnosticProvider = new TranslationDiagnosticProvider(indexManager);
  context.subscriptions.push(diagnosticProvider);

  // Register definition provider
  const definitionProvider = new TranslationDefinitionProvider(
    indexManager,
    root
  );
  for (const lang of languages) {
    context.subscriptions.push(
      vscode.languages.registerDefinitionProvider(
        { language: lang },
        definitionProvider
      )
    );
  }
}

export function deactivate() {
  indexManager?.dispose();
  diagnosticProvider?.dispose();
}

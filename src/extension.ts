import * as path from "path";
import * as vscode from "vscode";

const DART_EXTENSION_ID = "dart-code.dart-code";
const ICON_PATH = path.join(__dirname, "..", "media", "flutter-red.svg");

function createOutlineLabelerProvider(originalOutlineProvider: vscode.TreeDataProvider<unknown>) {
    const originalGetChildren = originalOutlineProvider.getChildren;

    originalOutlineProvider.getChildren = async function (
        element?: unknown
    ): Promise<vscode.TreeItem[]> {
        const originalItems: vscode.TreeItem[] = (await originalGetChildren.call(
            originalOutlineProvider,
            element
        )) as vscode.TreeItem[];

        for (const item of originalItems) {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                continue;
            }
            const document = activeEditor.document;

            const startPosition: vscode.Position = item.command?.arguments?.[1]?.start;
            const endPosition: vscode.Position = new vscode.Position(startPosition.line + 2, 0);
            const range: vscode.Range = new vscode.Range(startPosition, endPosition);
            const textInRange: string = document.getText(range);

            const customNameMatch: RegExpMatchArray | null = textInRange.match(/\/\/@\s*(.+)/);

            if (customNameMatch && !item["isVisited"]) {
                item.iconPath = ICON_PATH;

                if (item.description) {
                    item.description = `${item.label}: ${item.description}`;
                } else {
                    item.description = item.label as string;
                }

                // Set isVisited to true to avoid updating the same item again
                item["isVisited"] = true;

                item.label = customNameMatch[1].trim();
            }
        }

        return originalItems;
    };
}

async function activate(): Promise<void> {
    const dartExtension = vscode.extensions.getExtension(DART_EXTENSION_ID);

    if (!dartExtension) {
        vscode.window.showErrorMessage("Dart extension not found.");
        return;
    }

    if (!dartExtension.isActive) {
        await dartExtension.activate();
    }

    const originalOutlineProvider: vscode.TreeDataProvider<unknown> =
        dartExtension.exports._privateApi.flutterOutlineTreeProvider;

    if (!originalOutlineProvider) {
        vscode.window.showErrorMessage("Flutter Outline tree data provider not found.");
        return;
    }

    createOutlineLabelerProvider(originalOutlineProvider);
}

module.exports = {
    activate,
};

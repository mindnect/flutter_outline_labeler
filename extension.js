const vscode = require("vscode");
const path = require("path");

const DART_EXTENSION_ID = "dart-code.dart-code";
const ICON_PATH = path.join(__dirname, "media", "flutter-red.svg");

function createNamingFlutterOutlineProvider(originalOutlineProvider) {
    const originalGetChildren = originalOutlineProvider.getChildren;

    originalOutlineProvider.getChildren = async function (element) {
        const originalItems = await originalGetChildren.call(originalOutlineProvider, element);

        // Modify items here based on your requirements
        for (const item of originalItems) {
            // Get active text editor and its document
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                continue;
            }
            const document = activeEditor.document;

            // Check for custom name comment in the source code
            const startPosition = item.command.arguments[1].start;
            const endPosition = new vscode.Position(startPosition.line + 2, 0);
            const range = new vscode.Range(startPosition, endPosition);
            const textInRange = document.getText(range);

            // Replace label with custom name if found
            const customNameMatch = textInRange.match(/\/\/@\s*(.+)/);
            if (customNameMatch && !item.isVisited) {
                // Update properties using stored original values
                item.iconPath = ICON_PATH;

                // Update description only if originalDescription exists
                if (item.description) {
                    item.description = item.label + ": " + item.description;
                } else {
                    item.description = item.label;
                }

                // Set isVisited to true to avoid updating the same item again
                item.isVisited = true;

                item.label = customNameMatch[1].trim();
            }
        }

        return originalItems;
    };
}

async function activate() {
    const dartExtension = vscode.extensions.getExtension(DART_EXTENSION_ID);
    if (!dartExtension) {
        vscode.window.showErrorMessage("Dart extension not found.");
        return;
    }

    if (!dartExtension.isActive) {
        await dartExtension.activate();
    }
    const originalOutlineProvider = dartExtension.exports._privateApi.flutterOutlineTreeProvider;

    if (!originalOutlineProvider) {
        vscode.window.showErrorMessage("Flutter Outline tree data provider not found.");
        return;
    }

    // Create a custom TreeDataProvider by cloning the original one.
    createNamingFlutterOutlineProvider(originalOutlineProvider);
}

// keep old code for sure
// async function waitForProviderReady(provider) {
//     return new Promise((resolve) => {
//         const disposable = provider.onDidChangeTreeData(() => {
//             disposable.dispose(); // Dispose of the listener once it's triggered
//             resolve();
//         });
//     });
// }

module.exports = {
    activate,
};

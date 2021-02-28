import * as vscode from 'vscode';

export class IRISWebView implements vscode.Disposable {

  public static currentPanel: IRISWebView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private _url: string;

  public static readonly viewType = 'intersystems';

  public static createOrShow(extensionUri: vscode.Uri, url: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (IRISWebView.currentPanel) {
      IRISWebView.currentPanel._panel.reveal(column);
      IRISWebView.currentPanel.update(url)
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      IRISWebView.viewType,
      'InterSystems',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    IRISWebView.currentPanel = new IRISWebView(panel, url);
  }

  private constructor(panel: vscode.WebviewPanel, url: string) {
    this._panel = panel;

    // Set the webview's initial html content
    this.update(url);

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this.update(url);
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'alert':
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    IRISWebView.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  public update(url: string) {
    this._url = url;
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <style type="text/css">
          body, html {
            margin: 0; 
            padding: 0; 
            height: 100%;
          }
        </style>
      </head>
      <body>
      <iframe src="${this._url}" width="100%" height="100%" frameborder="0"></iframe>
      <script>
      const vscode = acquireVsCodeApi();
      window.addEventListener("message", receiveMessage, false);
      function receiveMessage(event) {
        vscode.postMessage(event.data);
      }
    </script>
    </body>
    </html>`;
  }
}
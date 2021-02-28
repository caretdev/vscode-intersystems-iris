import * as vscode from "vscode";
import { InterSystemsLanguageClient } from '../client';

export class SystemExplorerNode extends vscode.TreeItem {

  public constructor(public client: InterSystemsLanguageClient, label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }

  getChildren(element?: SystemExplorerNode): Thenable<SystemExplorerNode[]> {
    return null;
  }
}

export class SystemExplorerRootNode extends SystemExplorerNode {
  public constructor(client: InterSystemsLanguageClient, label: string) {
    super(client, label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  getChildren(element?: SystemExplorerNode): Thenable<SystemExplorerNode[]> {
    return this.client.globals()
      .then(result => result.list.map(el => new GlobalNode(this.client, el.name)));
  }
}

export class GlobalNode extends SystemExplorerNode {

}

export class SystemExplorerNodeProvider implements vscode.TreeDataProvider<SystemExplorerNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<SystemExplorerNode | undefined | void> = new vscode.EventEmitter<SystemExplorerNode | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<SystemExplorerNode | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private client: InterSystemsLanguageClient) {
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SystemExplorerNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SystemExplorerNode): Thenable<SystemExplorerNode[]> {
    if (element) {
      return element.getChildren();
    } else {
      return Promise.resolve([
        new SystemExplorerRootNode(this.client, "Globals")
      ])
    }
  }
}

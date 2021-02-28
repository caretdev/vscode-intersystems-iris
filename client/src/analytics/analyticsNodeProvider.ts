import * as vscode from "vscode";
import { InterSystemsLanguageClient } from '../client';

export class AnalyticsBase extends vscode.TreeItem {
  constructor(public client: InterSystemsLanguageClient, label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
  getChildren(): Thenable<AnalyticsBase[]> {
    return null;
  }
}

export class AnalyticsRoot extends AnalyticsBase {
  constructor(public client: InterSystemsLanguageClient, label: string) {
    super(client, label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  getChildren(): Thenable<AnalyticsBase[]> {
    return null;
  }

}

export class CubeBase extends AnalyticsBase {
  constructor(public client: InterSystemsLanguageClient, public folder: string, label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(client, label, collapsibleState);
  }

  getChildren(): Thenable<AnalyticsBase[]> {
    return null;
  }
}

export class Cube extends CubeBase {
  constructor(public client: InterSystemsLanguageClient, label: string) {
    super(client, label, label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "cube";
  }
}

export class AnalyticsNodeProvider implements vscode.TreeDataProvider<AnalyticsBase> {
  private _onDidChangeTreeData: vscode.EventEmitter<AnalyticsBase | undefined | void> = new vscode.EventEmitter<AnalyticsBase | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<AnalyticsBase | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private client: InterSystemsLanguageClient) {
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AnalyticsBase): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AnalyticsBase): Thenable<AnalyticsBase[]> {
    if (element) {
      return element.getChildren();
    } else {
      return Promise.resolve([
        new AnalyticsRoot(this.client, "Cubes")
      ])
    }
  }
}

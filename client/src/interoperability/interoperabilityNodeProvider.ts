import * as vscode from "vscode";
import { InterSystemsLanguageClient } from '../client';

export class InteroperabilityBase extends vscode.TreeItem {
  constructor(public client: InterSystemsLanguageClient, label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
  getChildren(): Thenable<InteroperabilityBase[]> {
    return null;
  }
}

export class InteroperabilityRoot extends InteroperabilityBase {
  constructor(public client: InterSystemsLanguageClient, label: string) {
    super(client, label, vscode.TreeItemCollapsibleState.Collapsed);
  }

  getChildren(): Thenable<InteroperabilityBase[]> {
    return this.client.productions()
      .then(result => result.list.map(el => new Production(this.client, el.id, el.status)));
  }

}

export class ProductionBase extends InteroperabilityBase {
  constructor(public client: InterSystemsLanguageClient, public production: string, label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(client, label, collapsibleState);
  }

  getChildren(): Thenable<InteroperabilityBase[]> {
    return Promise.resolve([
      new ProductionService(this.client, this.production, "Services", vscode.TreeItemCollapsibleState.Collapsed),
      new ProductionProcess(this.client, this.production, "Processes", vscode.TreeItemCollapsibleState.Collapsed),
      new ProductionOperation(this.client, this.production, "Operations", vscode.TreeItemCollapsibleState.Collapsed),
    ]);
  }
}

export class Production extends ProductionBase {
  constructor(public client: InterSystemsLanguageClient, label: string, status: string) {
    super(client, label, label, vscode.TreeItemCollapsibleState.Collapsed);
    this.production = label;
    if ("Running" == status) {
      this.iconPath = new vscode.ThemeIcon("debug-start");
    } else if ("Stopped" == status) {
      this.iconPath = new vscode.ThemeIcon("debug-stop");
    } else if ("Suspended" == status) {
      this.iconPath = new vscode.ThemeIcon("debug-pause");
    } else {
      this.iconPath = new vscode.ThemeIcon("warning");
    }
    this.contextValue = `production:${status}`;
  }
}

export class ProductionService extends ProductionBase {
  getChildren(): Thenable<ProductionBase[]> {
    return this.client.productionServices(this.production)
      .then(el => el.list.map(el => new ProductionService(this.client, this.production, el.id)));
  }
}

export class ProductionProcess extends ProductionBase {
  getChildren(): Thenable<ProductionBase[]> {
    return this.client.productionProcesses(this.production)
      .then(el => el.list.map(el => new ProductionService(this.client, this.production, el.id)));
  }
}

export class ProductionOperation extends ProductionBase {
  getChildren(): Thenable<ProductionBase[]> {
    return this.client.productionOperations(this.production)
      .then(el => el.list.map(el => new ProductionService(this.client, this.production, el.id)));
  }
}

export class InteroperabilityNodeProvider implements vscode.TreeDataProvider<InteroperabilityBase> {
  private _onDidChangeTreeData: vscode.EventEmitter<InteroperabilityBase | undefined | void> = new vscode.EventEmitter<InteroperabilityBase | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<InteroperabilityBase | undefined | void> = this._onDidChangeTreeData.event;

  public constructor(private client: InterSystemsLanguageClient) {
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: InteroperabilityBase): vscode.TreeItem {
    return element;
  }

  getChildren(element?: InteroperabilityBase): Thenable<InteroperabilityBase[]> {
    if (element) {
      return element.getChildren();
    } else {
      return Promise.resolve([
        new InteroperabilityRoot(this.client, "Production")
      ])
    }
  }
}

import * as vscode from 'vscode';
import {
  LanguageClient,
  RequestType,
  RequestType0,
  ServerOptions,
  LanguageClientOptions,
  NotificationType0,
} from 'vscode-languageclient/node';

export interface Production {
  id: string;
  status: string;
}

export interface ProductionsResult {
  list: Production[];
}

export interface ProductionsRequestParams {
  test?: boolean;
}

export interface Global {
  name: string;
}

export interface GlobalsResult {
  list: Global[];
}

export interface GlobalsRequestParams {
  test?: boolean;
}

abstract class ProductionsRequest {
  public static type = new RequestType<
    ProductionsRequestParams,
    ProductionsResult,
    void
  >('intersystems/productions');
}

abstract class GlobalsRequest {
  public static type = new RequestType<
    GlobalsRequestParams,
    GlobalsResult,
    void
  >('intersystems/globals');
}

export class InterSystemsLanguageClient extends LanguageClient {
  constructor(
    name: string,
    serverOptions: ServerOptions,
    clientOptions: LanguageClientOptions,
  ) {
    super(name, serverOptions, clientOptions);
    this.registerProposedFeatures();
  }

  public async productions(): Promise<ProductionsResult> {
    return this.sendRequest(ProductionsRequest.type, {});
  }

  public async productionServices(id: String): Promise<ProductionsResult> {
    return this.sendRequest("intersystems/productions/services", { id });
  }

  public async productionOperations(id: String): Promise<ProductionsResult> {
    return this.sendRequest("intersystems/productions/operations", { id });
  }

  public async productionProcesses(id: String): Promise<ProductionsResult> {
    return this.sendRequest("intersystems/productions/processes", { id });
  }

  public async globals(): Promise<GlobalsResult> {
    return this.sendRequest(GlobalsRequest.type, {});
  }
}

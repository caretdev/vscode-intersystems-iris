import * as vscode from 'vscode';
import * as os from 'os';

import {
  ServerOptions,
} from 'vscode-languageclient/node';

import { InteroperabilityNodeProvider } from "./interoperability/interoperabilityNodeProvider";
import { SystemExplorerNodeProvider } from "./system-explorer/systemExplorerNodeProvider";
// import { AnalyticsNodeProvider } from "./analytics/analyticsNodeProvider";

import { IRISWebView } from "./irisWebView";
import { InterSystemsLanguageClient } from './client';

export function activate(context: vscode.ExtensionContext) {
  const serverConfig = vscode.workspace.getConfiguration('objectscript.server');
  const serverName = os.platform() === 'win32' ? 'iris-ls.exe' : 'iris-ls';
  const localServerPath = context.asAbsolutePath(`target/release/${serverName}`);
  const serverCommand = localServerPath;

  const serverOptions = getServerOptions(serverCommand, serverConfig);
  const client = new InterSystemsLanguageClient(
    'iris-ls',
    serverOptions,
    {
      outputChannelName: 'InterSystems IRIS',
      uriConverters: {
        code2Protocol: (uri) => uri.toString(true),
        protocol2Code: (value) => vscode.Uri.parse(value),
      },
    },
  );
  const interoperabiltyNodeProvider = new InteroperabilityNodeProvider(client);
  const systemExplorerNodeProvider = new SystemExplorerNodeProvider(client);
  // const analyticsNodeProvider = new AnalyticsNodeProvider(client);

  context.subscriptions.push(
    vscode.commands.registerCommand("intersystems.productions.refresh", () => interoperabiltyNodeProvider.refresh()),
    vscode.commands.registerCommand("intersystems.productions.stop", () => vscode.window.showErrorMessage("Not Implemented")),
    vscode.commands.registerCommand("intersystems.productions.start", () => vscode.window.showErrorMessage("Not Implemented")),
    vscode.commands.registerCommand("intersystems.productions.restart", () => vscode.window.showErrorMessage("Not Implemented")),
    vscode.commands.registerCommand("intersystems.productions.open", (id) => IRISWebView.createOrShow(context.extensionUri, id)),
    vscode.commands.registerCommand("intersystems.productions.export", () => vscode.window.showErrorMessage("Not Implemented")),

    vscode.commands.registerCommand("intersystems.globals.refresh", () => systemExplorerNodeProvider.refresh()),
    vscode.commands.registerCommand("intersystems.globals.export", () => vscode.window.showErrorMessage("Not Implemented")),
    client.start(),
  );
  client.onReady().then(() => {
    vscode.window.createTreeView('intersystems-interoperability', { treeDataProvider: interoperabiltyNodeProvider, showCollapseAll: true });
    vscode.window.createTreeView('intersystems-system-explorer', { treeDataProvider: systemExplorerNodeProvider, showCollapseAll: true });
    // vscode.window.createTreeView('intersystems-analytics', { treeDataProvider: analyticsNodeProvider, showCollapseAll: true });
  })
}

function getServerOptions(
  serverCommand: string,
  serverConfig: vscode.WorkspaceConfiguration,
): ServerOptions {
  const trace = serverConfig.get<boolean>('trace');
  const logFilePath = serverConfig.get<string | undefined>('logFile');
  const args = [];
  if (trace) {
    args.push('-vvvv');
  }

  if (logFilePath) {
    args.push('--log-file');
    args.push(logFilePath);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ELECTRON_RUN_AS_NODE, ...env } = process.env;
  return {
    run: {
      command: serverCommand,
      args,
      options: {
        env,
      },
    },
    debug: {
      command: serverCommand,
      args,
      options: {
        env: {
          ...env,
          RUST_BACKTRACE: '1',
        },
      },
    },
  };
}

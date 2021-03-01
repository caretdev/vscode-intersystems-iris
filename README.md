# VSCode extension for advanced Management of InterSystems IRIS

## Key Features

This extension uses LanguageServer to communicate directly with InterSystems IRIS over SuperPort (1972). LanguageServer is written on Rust and utilizes Rust irisnative library. The extension does not use Atelier API.

## Installation

At the moment only macOS version is available for installation. In the future more platforms will be available, including windows and linux on ARM64.

- Download the latest version of vsix file from [releases](https://github.com/daimor/vscode-intersystems-iris/releases)
- Install the file with drag-n-drop to Extensions view in VSCode, or by command `Install from VSIX...`

## Configuration

The extension does not reequire VSCode-ObjectScript extension, but uses some of the settings it provides. In addition to `objectscript.conn` settings, the extension requires setting `objectscript.conn.superPort` to be set. Example of desired settings.

```JSON
{
  "objectscript.conn": {
    "active": true,
    "host": "localhost",
    "port": 52773,
    "ns": "USER",
    "username": "_SYSTEM",
    "password": "SYS"
  },
  "objectscript.conn.superPort": 1972,
}
```

## Extension in action

![example](https://raw.githubusercontent.com/daimor/vscode-intersystems-iris/main/images/screenshot.png)

The extension adds two more views:

- Interoperability, access to Productions and their statuses with all the items.
- System Explorer, with the list of globals in the namespace.

# VSCode extension for advanced Management of InterSystems IRIS

## Key Features

This extension uses LanguageServer to communicate directly with InterSystems IRIS over SuperPort (1972). LanguageServer is written on Rust and utilizes Rust irisnative library. The extension does not use Atelier API.

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

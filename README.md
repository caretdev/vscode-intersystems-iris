# VSCode extension for advanced Management of InterSystems IRIS

## Key Features

This extension uses LanguageServer to communicate directly with InterSystems IRIS over SuperPort (1972). LanguageServer is written on Rust and utilizes [Rust irisnative](#rust-iris-native-driver) library. The extension does not use Atelier API.

## Installation

- Download the latest version of vsix file from [releases](https://github.com/daimor/vscode-intersystems-iris/releases) for your platform
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

## Rust IRIS Native driver

Works directly over super server port (1972). Supports work with globals and simple SQL queries.

Example of code.

```Rust
use irisnative;
use irisnative::{connection::*, global, global::Sub, Global};

fn main() {
  let host = "127.0.0.1";
  let port = 1972;
  let namespace = "USER";
  let username = "_SYSTEM";
  let password = "SYS";
  match irisnative::connect(host, port, namespace, username, password) {
    Ok(mut connection) => {
      println!("Connection established");

      println!("Server: {}", connection.server_version());

      connection.kill(&global!(A));
      connection.set(&global!(A(1)), "1");
      connection.set(&global!(A(1, 2)), "test");
      connection.set(&global!(A(1, "2", 3)), "123");
      connection.set(&global!(A(2, 1)), "21test");
      connection.set(&global!(A(3, 1)), "test31");

      let mut global = global!(A(""));
      while let Some(key) = connection.next(&mut global) {
        println!("^A({:?}) = {:?}", key, {
          if connection.is_defined(&global).0 {
            let value: String = connection.get(&global).unwrap();
            value
          } else {
            String::from("<UNDEFINED>")
          }
        });
        let mut global1 = global!(A(key, ""));
        while let Some(key1) = connection.next(&mut global1) {
          let value: String;
          if connection.is_defined(&global1).0 {
            value = connection.get(&global1).unwrap();
          } else {
            value = String::from("<UNDEFINED>");
          }
          println!("^A({:?}, {:?}) = {:?}", key, key1, value);
        }
      }

      let mut rs = connection.query(String::from(
        "SELECT Name from %Dictionary.ClassDefinition WHERE Super = 'Ens.Production' and Abstract<>1"));
      while rs.next() {        
        let name: String = rs.get(0).unwrap();
        println!("{}", name);
      }
    }
    Err(err) => {
      println!("Error: {}", err.message);
    }
  }
}
```

use futures::{channel::mpsc, prelude::*};
use iris_ls::{
    protocol::{InterSystemsLspClient, LspCodec},
    server::InterSystemsLspServer,
};
use jsonrpc::MessageHandler;
use log::{trace, LevelFilter};
use std::path::PathBuf;
use std::{env, error, fs::OpenOptions, sync::Arc};
use structopt::StructOpt;
use tokio_util::codec::{FramedRead, FramedWrite};

#[derive(Debug, StructOpt)]
struct Opts {
    /// Increase message verbosity (-vvvv for max verbosity)
    #[structopt(short, long, parse(from_occurrences))]
    verbosity: u8,

    /// No output printed to stderr
    #[structopt(short, long)]
    quiet: bool,

    /// Write the logging output to FILE
    #[structopt(long, name = "FILE", parse(from_os_str))]
    log_file: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn error::Error>> {
    let opts = Opts::from_args();
    setup_logger(opts);
    trace!("Starting server\n");

    let mut stdin = FramedRead::new(tokio::io::stdin(), LspCodec);
    let (stdout_tx, mut stdout_rx) = mpsc::channel(0);

    let client = Arc::new(InterSystemsLspClient::new(stdout_tx.clone()));
    let server = Arc::new(InterSystemsLspServer::new(
        Arc::clone(&client),
        Arc::new(env::current_dir().expect("failed to get working directory")),
    ));
    let mut handler = MessageHandler {
        server,
        client,
        output: stdout_tx,
    };

    tokio::spawn(async move {
        let mut stdout = FramedWrite::new(tokio::io::stdout(), LspCodec);
        loop {
            let message = stdout_rx.next().await.unwrap();
            stdout.send(message).await.unwrap();
        }
    });

    while let Some(json) = stdin.next().await {
        handler.handle(&json.unwrap()).await;
    }

    Ok(())
}

fn setup_logger(opts: Opts) {
    let verbosity_level = if !opts.quiet {
        match opts.verbosity {
            0 => LevelFilter::Error,
            1 => LevelFilter::Warn,
            2 => LevelFilter::Info,
            3 => LevelFilter::Debug,
            _ => LevelFilter::Trace,
        }
    } else {
        LevelFilter::Off
    };

    let logger = fern::Dispatch::new()
        .format(|out, message, record| out.finish(format_args!("{} - {}", record.level(), message)))
        .level(verbosity_level)
        .filter(|metadata| metadata.target() == "jsonrpc" || metadata.target().contains("iris-ls"))
        .chain(std::io::stderr());

    let logger = match opts.log_file {
        Some(log_file) => logger.chain(
            OpenOptions::new()
                .write(true)
                .create(true)
                .open(log_file)
                .expect("failed to open log file"),
        ),
        None => logger,
    };

    logger.apply().expect("failed to initialize logger");
}

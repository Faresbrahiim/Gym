#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    tracing::info!("presence-service starting");
}

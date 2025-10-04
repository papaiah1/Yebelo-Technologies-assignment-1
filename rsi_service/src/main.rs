use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::ClientConfig;
use rdkafka::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use futures::StreamExt;
use tokio::time::Duration;

#[derive(Deserialize)]
struct Trade {
    trade_id: u32,
    symbol: String,
    price: f64,
    quantity: u32,
    timestamp: String,
}

#[derive(Serialize)]
struct RsiData {
    symbol: String,
    rsi: f64,
    timestamp: String,
}

struct RsiCalculator {
    period: usize,
    price_history: HashMap<String, Vec<f64>>,
}

impl RsiCalculator {
    fn new(period: usize) -> Self {
        Self {
            period,
            price_history: HashMap::new(),
        }
    }

    fn calculate(&mut self, symbol: &str, price: f64) -> Option<f64> {
        let history = self.price_history.entry(symbol.to_string()).or_insert(vec![]);
        history.push(price);

        if history.len() < self.period + 1 {
            return None; // need at least period+1 prices
        }

        if history.len() > self.period + 1 {
            history.remove(0);
        }

        let mut gains = 0.0;
        let mut losses = 0.0;

        for i in 1..history.len() {
            let change = history[i] - history[i - 1];
            if change > 0.0 { gains += change; }
            else { losses += -change; }
        }

        let avg_gain = gains / self.period as f64;
        let avg_loss = losses / self.period as f64;

        if avg_loss == 0.0 { return Some(100.0); }
        let rs = avg_gain / avg_loss;
        Some(100.0 - (100.0 / (1.0 + rs)))
    }
}

#[tokio::main]
async fn main() {
    // Kafka consumer
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .set("group.id", "rsi_group")
        .set("auto.offset.reset", "earliest")
        .create()
        .expect("Consumer creation failed");

    consumer.subscribe(&["trade-data"]).expect("Subscription failed");

    // Kafka producer
    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", "localhost:9092")
        .create()
        .expect("Producer creation failed");

    let mut rsi_calculator = RsiCalculator::new(14);

    let mut message_stream = consumer.stream();
    while let Some(result) = message_stream.next().await {
        match result {
            Ok(msg) => {
                if let Some(payload) = msg.payload_view::<str>().ok().flatten() {
                    let trade: Trade = serde_json::from_str(payload).unwrap();
                    if let Some(rsi) = rsi_calculator.calculate(&trade.symbol, trade.price) {
                        let rsi_msg = RsiData {
                            symbol: trade.symbol.clone(),
                            rsi,
                            timestamp: trade.timestamp.clone(),
                        };
                        let _ = producer.send(
                            FutureRecord::to("rsi-data")
                                .payload(&serde_json::to_string(&rsi_msg).unwrap())
                                .key(&trade.symbol),
                            Duration::from_secs(0)
                        ).await;
                        println!("Published RSI: {} -> {:.2}", trade.symbol, rsi);
                    }
                }
            },
            Err(e) => println!("Kafka error: {:?}", e),
        }
    }
}

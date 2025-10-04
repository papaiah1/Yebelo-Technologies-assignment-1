import pandas as pd
import json
from confluent_kafka import Producer

# Redpanda broker (matches docker-compose setup)
BROKER = "localhost:9092"
TOPIC = "trade-data"

# Kafka producer config
conf = {
    "bootstrap.servers": BROKER
}
producer = Producer(conf)

def delivery_report(err, msg):
    """Reports the success/failure of a message delivery."""
    if err is not None:
        print(f"❌ Delivery failed: {err}")
    else:
        print(f"✅ Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}")

# Load CSV
df = pd.read_csv("trades.csv")

# Stream each row to Redpanda
for _, row in df.iterrows():
    message = row.to_dict()
    producer.produce(
        TOPIC,
        key=str(row["trade_id"]),
        value=json.dumps(message),
        callback=delivery_report
    )
    producer.poll(0)  # Trigger delivery callbacks

producer.flush()
print("🚀 Finished streaming CSV to Redpanda")

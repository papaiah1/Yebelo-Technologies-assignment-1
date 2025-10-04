// server.js
const express = require('express');
const { Kafka } = require('kafkajs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const MAX_POINTS = 1000;

const priceStore = {};
const rsiStore = {};

function pushCap(store, symbol, point) {
  if (!store[symbol]) store[symbol] = [];
  store[symbol].push(point);
  if (store[symbol].length > MAX_POINTS) store[symbol].shift();
}

const kafka = new Kafka({
  clientId: 'dashboard-backend',
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'dashboard-dashboard-group' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'trade-data', fromBeginning: true });
  await consumer.subscribe({ topic: 'rsi-data', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const obj = JSON.parse(message.value.toString());

        if (topic === 'trade-data') {
          const symbol = obj.symbol || 'UNKNOWN';
          const ts = obj.timestamp || new Date().toISOString();
          const price = parseFloat(obj.price);
          if (!Number.isNaN(price)) pushCap(priceStore, symbol, { ts, price });
        } else if (topic === 'rsi-data') {
          const symbol = obj.symbol || 'UNKNOWN';
          const ts = obj.timestamp || new Date().toISOString();
          const rsi = parseFloat(obj.rsi);
          if (!Number.isNaN(rsi)) pushCap(rsiStore, symbol, { ts, rsi });
        }
      } catch (err) {
        console.error('Error parsing message', err);
      }
    },
  });

  console.log(`Kafka consumer connected to ${KAFKA_BROKER}`);
}

app.get('/price', (req, res) => {
  const symbol = (req.query.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  res.json(priceStore[symbol] || []);
});

app.get('/rsi', (req, res) => {
  const symbol = (req.query.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  res.json(rsiStore[symbol] || []);
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Dashboard backend listening on http://localhost:${PORT}`);
  try {
    await startConsumer();
  } catch (err) {
    console.error('Failed to start Kafka consumer', err);
    process.exit(1);
  }
});

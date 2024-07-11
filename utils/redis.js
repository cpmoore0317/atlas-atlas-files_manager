// utils/redis.js

const { createClient } = require('redis');

const client = createClient();

client.on('error', (err) => {
  console.log('Redis Client Error', err);
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

async function getValue(key) {
  await connectRedis();
  return await client.get(key);
}

async function isAlive() {
  await connectRedis();
  return client.isOpen;
}

module.exports = {
  getValue,
  isAlive,
  client,
};

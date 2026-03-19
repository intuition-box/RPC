# Syncing

## What's happening

The node has finished scanning historical data and is now processing new blocks to catch up to the chain head. Blocks are created rapidly — typically thousands per minute — until the node reaches the latest block.

## How blocks are created

The node derives L3 blocks from two data sources:

1. **Sequencer batches on Base** — compressed transaction bundles posted by the sequencer to the Sequencer Inbox contract. The node reads these from Base, decompresses them, and executes the transactions to produce blocks.

2. **Sequencer feed** — a WebSocket connection to `wss://rpc.intuition.systems/feed` that delivers new blocks in real-time. This is faster than waiting for batches to be posted to Base (which has a delay).

During the catch-up phase, the node primarily uses batches from Base. Once it's close to the head, the feed takes over for real-time block delivery.

## Block production rate

The syncing speed depends on:
- **Alchemy RPC throughput** — how fast the node can read batches from Base
- **CPU** — decompressing and executing transactions
- **Chain activity** — more transactions per batch = more processing per block

Typical rates: 500-3,000 blocks/minute during catch-up.

## Further reading

- [Arbitrum Sequencer](https://docs.arbitrum.io/how-arbitrum-works/sequencer)
- [Nitro's Execution Engine](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro#geth-at-the-core)

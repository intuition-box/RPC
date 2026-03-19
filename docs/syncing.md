# Syncing

## What's happening

The node has finished verifying historical data and is now executing new batches to catch up to the chain head. Blocks are created rapidly — typically 500 to 3,000 per minute — until it reaches the latest block.

## How blocks are created

The node derives L3 blocks from two sources:

- **Sequencer batches on Base** — the canonical source. The node reads compressed transaction bundles posted by the sequencer to the Sequencer Inbox contract, decompresses them, and executes the transactions to produce blocks. For AnyTrust batches, it first fetches the raw data from the DAS using the certificate hash.

- **Sequencer feed** — a real-time WebSocket stream. As the node approaches the chain head, the feed takes over for instant block delivery (milliseconds vs minutes for on-chain batches).

During catch-up, the node primarily uses batches. Once near the head, the feed provides real-time blocks and batches serve as on-chain confirmation.

## What affects sync speed

- **Alchemy throughput** — Free tier (25 req/s) is significantly slower than Pay As You Go (300 req/s) for reading batches
- **CPU** — decompressing and executing transactions is CPU-bound
- **DAS availability** — fetching data from the REST aggregator adds latency per batch

## Arbitrum docs

- [The Sequencer](https://docs.arbitrum.io/how-arbitrum-works/sequencer) — feed relay and batch posting
- [Inside Arbitrum Nitro — Geth at the Core](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro) — how the EVM execution engine processes transactions

# Synced

## What's happening

The node is fully synced and following the Intuition L3 chain in real-time. It serves as an independent RPC endpoint.

## How it stays in sync

Three mechanisms run concurrently:

- **Sequencer feed** — receives new blocks via WebSocket within milliseconds of the sequencer producing them
- **Batch verification** — periodically reads new batches from Base to confirm that feed data matches what was posted on-chain
- **Watchtower** — continues monitoring rollup assertions for chain integrity

## What it can do

Your replica supports the same RPC methods as any Ethereum node — `eth_call`, `eth_blockNumber`, `eth_getLogs`, `eth_sendRawTransaction`, WebSocket subscriptions, and more. Transactions sent to your node are automatically forwarded to the sequencer.

## Steady-state resource usage

| Resource | Usage |
|---|---|
| CPU | ~1% |
| RAM | ~400 MB |
| Alchemy | ~1-2M CU/month (< $1) |

## Arbitrum docs

- [Transaction Lifecycle](https://docs.arbitrum.io/how-arbitrum-works/transaction-lifecycle) — how a transaction goes from submission to finality
- [Running a Full Node](https://docs.arbitrum.io/run-arbitrum-node/run-full-node) — node operation and configuration
- [Running a Feed Relay](https://docs.arbitrum.io/run-arbitrum-node/run-feed-relay) — how the sequencer feed works

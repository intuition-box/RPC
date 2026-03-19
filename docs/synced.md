# Synced

## What's happening

The node is fully synced and following the chain in real-time. It serves as a fully independent RPC endpoint for the Intuition L3.

## How it stays in sync

The node maintains sync through:

1. **Sequencer feed** — receives new blocks via WebSocket within milliseconds of the sequencer producing them
2. **Batch verification** — periodically reads new batches from Base to verify the feed data matches what was posted on-chain
3. **Watchtower** — continues monitoring rollup assertions to verify chain integrity

## What it can do

Your replica node supports the same RPC methods as any Ethereum node:

- `eth_blockNumber`, `eth_getBlockByNumber`, `eth_getBlockByHash`
- `eth_call`, `eth_estimateGas`, `eth_getBalance`
- `eth_getTransactionReceipt`, `eth_getTransactionByHash`
- `eth_getLogs` (with full archive history)
- `eth_sendRawTransaction` (forwarded to the sequencer)
- WebSocket subscriptions (`eth_subscribe`)

## Transaction forwarding

When a user sends a transaction to your replica via `eth_sendRawTransaction`, the node forwards it to the sequencer at `wss://rpc.intuition.systems/ws`. The sequencer includes it in a batch, and your node picks it up via the feed.

## Resource usage (steady state)

| Resource | Usage |
|---|---|
| CPU | ~1% (1 core) |
| RAM | ~400 MB |
| Alchemy CU | ~1-2M / month |
| Alchemy cost | < $1 / month |

## Further reading

- [Arbitrum Transaction Lifecycle](https://docs.arbitrum.io/how-arbitrum-works/transaction-lifecycle)
- [Running a Full Node](https://docs.arbitrum.io/run-arbitrum-node/run-full-node)

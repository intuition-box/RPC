# Starting the Node

## What's happening

The Nitro node boots and establishes connections to all required services:

1. **Parent chain (Base)** — connects via the `BASE_RPC_URL` to read rollup contracts, sequencer batches, and delayed inbox messages
2. **Sequencer feed** — connects to `wss://rpc.intuition.systems/feed` to receive new blocks in real-time
3. **Forwarding target** — connects to `wss://rpc.intuition.systems/ws` to forward user transactions to the sequencer
4. **DAS (Data Availability Service)** — connects to `https://rpc.intuition.systems/rest-aggregator` for data availability certificates

## Startup sequence

When Nitro starts, it:

1. Opens the PebbleDB database from the datadir
2. Loads the most recent local block from the snapshot
3. Rebuilds the state snapshot (in-memory trie cache) if needed
4. Connects to the parent chain (Base) via RPC
5. Starts the P2P networking layer
6. Opens HTTP (port 8545) and WebSocket (port 8546) endpoints
7. Initializes the staker/watchtower module
8. Begins scanning for new data

## Watchtower mode

The node runs as a **Watchtower** — a passive validator that monitors rollup assertions on Base without staking or posting transactions. If it detects an invalid assertion, it logs a warning. This provides an independent verification of the chain's integrity.

Configuration flags:
```
--node.staker.enable
--node.staker.strategy=Watchtower
```

## Further reading

- [Arbitrum Nitro Architecture](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro)
- [Running a Watchtower](https://docs.arbitrum.io/run-arbitrum-node/run-full-node#watchtower-mode)
- [Data Availability Committees](https://docs.arbitrum.io/run-arbitrum-node/data-availability-committee/introduction)

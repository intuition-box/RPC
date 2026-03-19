# Starting the Node

## What's happening

The Nitro node boots and establishes connections to all the services it needs to follow the Intuition L3 chain.

## Connections

The node connects to four external services:

| Connection | Purpose |
|---|---|
| **Base RPC** (`BASE_RPC_URL`) | Read rollup contracts, sequencer batches, and delayed messages from the parent chain |
| **Sequencer feed** (`wss://rpc.intuition.systems/feed`) | Receive new blocks in real-time as the sequencer produces them |
| **Forwarding target** (`wss://rpc.intuition.systems/ws`) | Forward user transactions (e.g. `eth_sendRawTransaction`) to the sequencer |
| **DAS aggregator** (`https://rpc.intuition.systems/rest-aggregator`) | Fetch transaction data for AnyTrust batches via Data Availability Certificates |

## Startup sequence

1. Opens the database from the snapshot
2. Loads the most recent block and state
3. Connects to Base via RPC
4. Opens HTTP (8545) and WebSocket (8546) endpoints
5. Starts the Watchtower module
6. Begins scanning historical data

## Watchtower mode

The node runs as a Watchtower — it passively monitors rollup assertions posted to Base without staking or posting transactions. If it detects an invalid assertion, it logs a warning. This provides independent verification of the chain's integrity without any financial commitment.

## Arbitrum docs

- [Inside Arbitrum Nitro](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro) — node architecture and components
- [Watchtower Mode](https://docs.arbitrum.io/run-arbitrum-node/run-full-node) — passive validation
- [Data Availability Committees](https://docs.arbitrum.io/run-arbitrum-node/data-availability-committee/introduction) — how AnyTrust chains handle data availability
- [The Sequencer](https://docs.arbitrum.io/how-arbitrum-works/sequencer) — feed relay and transaction ordering

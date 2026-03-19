# Scanning Chain Data

## What's happening

After starting, the node must verify all historical data posted to Base before it can process new blocks. This happens in two sub-phases, and during both the block number stays stuck at the snapshot height — this is normal.

## Phase 1: Validating rollup assertions

The Watchtower walks through every rollup assertion posted to the Rollup contract on Base. Assertions are state commitments made by validators — each one claims "after processing these batches, the chain state is X."

The node checks each assertion against its local state to confirm the chain's integrity. This takes ~2-5 minutes depending on the number of assertions (currently ~340).

### What you see
```
Validating rollup assertions
Assertion 299 / 338 — 88%
```

## Phase 2: Scanning sequencer batches

Next, the node scans all sequencer batches posted to the Sequencer Inbox contract on Base. These are compressed bundles of L3 transactions that the sequencer posts to the parent chain.

For batches already covered by the snapshot, the node verifies them against its local data. For new batches (posted since the snapshot), it queues them for execution in the next phase.

Since the Intuition L3 uses AnyTrust (a Data Availability Committee), most batches contain a compact certificate (DACert) instead of the full transaction data. The node fetches the actual data from the DAS REST aggregator.

This phase makes heavy use of Alchemy credits — thousands of `eth_getLogs` and `eth_call` requests to Base. A full scan costs less than $1 on Pay As You Go.

### What you see
```
Scanning sequencer batches
Batch 5,896 / 7,652 — 77%
```

## Arbitrum docs

- [Assertions and Dispute Resolution](https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction) — how assertions work
- [The Sequencer](https://docs.arbitrum.io/how-arbitrum-works/sequencer) — batch posting and ordering
- [AnyTrust Protocol](https://docs.arbitrum.io/how-arbitrum-works/inside-anytrust) — DACerts and data availability
- [The Rollup Chain](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro) — how the rollup protocol secures the chain

# Scanning Chain Data

## What's happening

After starting, the node must verify all historical data before it can process new blocks. This happens in two sub-phases.

## Phase 1: Validating rollup assertions

The Watchtower walks through every **rollup assertion** posted to the parent chain (Base). Assertions are claims about the L3 state made by validators — each one says "after processing these batches, the chain state is X."

The node verifies each assertion by:
1. Reading the assertion from the rollup contract on Base (`0x6B78C90257A7a12a3E91EbF3CAFcc7E518FAcD38`)
2. Checking if it has the corresponding state locally
3. Confirming the assertion is correct

This takes ~2-5 minutes depending on how many assertions exist (currently ~340).

### What you see in the dashboard
```
Validating rollup assertions
Assertion 299 / 338 — 88%
```

## Phase 2: Scanning sequencer batches

After assertions, the node scans all **sequencer batches** posted to the Sequencer Inbox contract on Base (`0xFC239694C97b06BF2409C88EA199f7110f39A9bF`).

Sequencer batches are compressed bundles of L3 transactions posted by the sequencer to Base. The node reads each batch to derive the L3 chain state. Batches already in the snapshot are verified (logged as `duplicateBatches=1`), and new batches since the snapshot are processed to create new blocks.

This phase is where most Alchemy RPC credits are consumed — the node makes thousands of `eth_getLogs` and `eth_call` requests to Base.

### What you see in the dashboard
```
Scanning sequencer batches
Batch 5,896 / 7,652 — 77%
```

## Why the block number stays stuck

During scanning, the block number remains at the snapshot height. This is normal — the node is verifying data it already has, not creating new blocks yet. Once the scan reaches batches beyond the snapshot, new blocks start appearing rapidly.

## Alchemy usage during scanning

| RPC method | Cost | Usage |
|---|---|---|
| `eth_getLogs` | 60 CU | Heavy — reads batch events from Base |
| `eth_call` | 26 CU | Moderate — reads contract state |
| `eth_getBlockByNumber` | 20 CU | Light — checks parent chain height |

Total scan cost: < $1 on Alchemy Pay As You Go.

## Further reading

- [Arbitrum Rollup Protocol](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro#the-rollup-chain)
- [Sequencer Inbox](https://docs.arbitrum.io/how-arbitrum-works/sequencer)
- [Assertion and Dispute Resolution](https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction)

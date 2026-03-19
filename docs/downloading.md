# Downloading the Snapshot

## What's happening

The node downloads a compressed snapshot of the Intuition L3 chain data from S3. This snapshot contains the full state of the chain at a specific block height, allowing the node to skip syncing from genesis.

## Why a snapshot?

Without a snapshot, the node would need to replay every transaction from block 0 — millions of blocks processed one by one from the parent chain (Base). This would take days and consume significant RPC credits. The snapshot provides a shortcut: download the pre-built state and only sync the blocks created since the snapshot was taken.

## What's inside the snapshot?

The ~32 GB compressed archive contains the Nitro node's data directory:

```
intuition/
├── nitro/
│   ├── l2chaindata/     # The chain's block and state data (largest portion)
│   ├── arbitrumdata/    # Arbitrum-specific data (delayed inbox, etc.)
│   ├── wasm/            # WebAssembly modules for state transition validation
│   └── LOCK             # Database lock file
├── keystore/            # Node identity keys
└── nodekey              # P2P network key
```

The `l2chaindata/` directory uses [PebbleDB](https://github.com/cockroachdb/pebble) (Go's key-value store) to store the Ethereum state trie, block headers, receipts, and transaction data.

## Configuration

The snapshot URL is configurable via environment variable:

```
SNAPSHOT_URL=https://constellationlabs-dashboard-beta.s3.amazonaws.com/intuition-03-11-2026.tar.gz
```

## Further reading

- [Arbitrum Nitro Architecture](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro)
- [Running a Full Node](https://docs.arbitrum.io/run-arbitrum-node/run-full-node)

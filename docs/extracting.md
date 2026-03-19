# Extracting the Snapshot

## What's happening

The compressed snapshot (~32 GB) is extracted to the node's data volume, producing ~43 GB of chain data. The extraction places the `intuition/` directory at the correct path where Nitro expects to find its data: `/home/user/.arbitrum/intuition/`.

## Directory mapping

The snapshot's internal structure is mapped to the Docker volume:

```
Snapshot (tar.gz)              Docker volume (/home/user/.arbitrum/)
mnt/datadir/intuition/    →    intuition/
         ├── nitro/                  ├── nitro/
         │   ├── l2chaindata/        │   ├── l2chaindata/
         │   └── ...                 │   └── ...
         └── keystore/               └── keystore/
```

The init container handles this path mapping automatically, including cleaning up the intermediate `mnt/datadir/` directories from the archive structure.

## Disk space requirements

During extraction, both the compressed archive and the extracted data exist on disk simultaneously:

| Phase | Disk used |
|---|---|
| Download complete | ~32 GB |
| Extraction in progress | ~32 GB + partial extraction |
| Extraction complete | ~43 GB (archive deleted) |
| **Peak usage** | **~75 GB** |

This is why a minimum of 100 GB disk is recommended.

## Further reading

- [Arbitrum Nitro Node Database](https://docs.arbitrum.io/run-arbitrum-node/run-full-node#database)

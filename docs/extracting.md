# Extracting the Snapshot

## What's happening

The compressed snapshot (~32 GB) is extracted to the node's data volume, producing ~43 GB of chain data. The extraction places files at the correct path where Nitro expects to find its data.

## Disk space

During extraction, both the compressed archive and the extracted data exist on disk simultaneously:

| Phase | Disk used |
|---|---|
| Download complete | ~32 GB |
| Extraction in progress | ~32 GB + partial extraction |
| Extraction complete (archive deleted) | ~43 GB |
| **Peak usage** | **~75 GB** |

This is why a minimum of 100 GB disk is recommended.

## Path mapping

The snapshot's archive structure doesn't always match what Nitro expects. The init container handles this automatically — moving files from the archive layout (`mnt/datadir/intuition/`) to the volume root (`intuition/`), and cleaning up any intermediate directories.

If the extraction is interrupted (container restart, disk full), the init container will detect the incomplete data on next startup and re-download the snapshot.

## Arbitrum docs

- [Running a Full Node — Persistent Data](https://docs.arbitrum.io/run-arbitrum-node/run-full-node) — database storage and directory structure

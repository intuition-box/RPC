#!/bin/sh
# Wait for init container to signal that datadir is ready
echo "Waiting for datadir to be ready..."
while [ ! -f /home/user/.arbitrum/.ready ]; do
  sleep 5
done
echo "Datadir ready, starting nitro"

exec /usr/local/bin/nitro \
  --conf.file=/config/nodeConfig.json \
  --node.staker.enable \
  --node.staker.strategy=Watchtower \
  --execution.forwarding-target=wss://rpc.intuition.systems/ws \
  --node.feed.input.url=wss://rpc.intuition.systems/feed \
  --parent-chain.connection.url=${BASE_RPC_URL} \
  --node.dangerous.disable-blob-reader \
  --node.data-availability.rest-aggregator.urls=https://rpc.intuition.systems/rest-aggregator \
  --node.data-availability.parent-chain-node-url=${BASE_RPC_URL}

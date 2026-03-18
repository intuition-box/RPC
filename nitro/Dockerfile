FROM public.ecr.aws/i6b2w2n6/nitro-node:v3.7.1
COPY nodeConfig.json /config/nodeConfig.json
COPY nitro/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

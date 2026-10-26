// JSON-RPC filter for the public (no API key) tier.
// Rejects expensive or admin methods and oversized batches, then hands the
// already-buffered request to the proxy location. VIB traffic never runs this.

const BLOCKED_PREFIXES = ['debug_', 'txpool_', 'admin_', 'personal_', 'miner_'];
const MAX_BATCH = 20;

function rpcError(id, code, message) {
    return { jsonrpc: '2.0', id: id === undefined ? null : id, error: { code: code, message: message } };
}

function reject(r, status, body) {
    r.headersOut['Content-Type'] = 'application/json';
    r.return(status, JSON.stringify(body));
}

function filter(r) {
    if (r.method !== 'POST') {
        r.internalRedirect('@public_http_proxy');
        return;
    }

    let req;
    try {
        req = JSON.parse(r.requestText || '');
    } catch (e) {
        reject(r, 400, rpcError(null, -32700, 'Parse error'));
        return;
    }

    const calls = Array.isArray(req) ? req : [req];
    if (calls.length > MAX_BATCH) {
        reject(r, 400, rpcError(null, -32600, 'Batch too large: max ' + MAX_BATCH + ' calls on the public RPC'));
        return;
    }

    // Plain loops: the njs engine in nginx:alpine lacks for...of
    for (var i = 0; i < calls.length; i++) {
        var call = calls[i];
        var method = call && typeof call.method === 'string' ? call.method : '';
        if (BLOCKED_PREFIXES.some(function (p) { return method.startsWith(p); })) {
            reject(r, 403, rpcError(call.id, -32601,
                'Method ' + method + ' is not available on the public RPC. Request a VIB key for full access.'));
            return;
        }
    }

    r.internalRedirect('@public_http_proxy');
}

export default { filter };

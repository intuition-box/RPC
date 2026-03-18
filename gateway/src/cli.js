import { addKey, revokeKey, rotateKey, listKeys, getStats } from './db.js';

const [,, command, ...args] = process.argv;

switch (command) {
  case 'add': {
    const name = args[0];
    if (!name) { console.error('Usage: rpc-keys add <name>'); process.exit(1); }
    const key = addKey(name);
    console.log(`Key created for "${name}":`);
    console.log(key);
    break;
  }

  case 'revoke': {
    const key = args[0];
    if (!key) { console.error('Usage: rpc-keys revoke <key>'); process.exit(1); }
    if (revokeKey(key)) {
      console.log('Key revoked.');
    } else {
      console.error('Key not found or already revoked.');
    }
    break;
  }

  case 'rotate': {
    const oldKey = args[0];
    if (!oldKey) { console.error('Usage: rpc-keys rotate <key>'); process.exit(1); }
    const newKey = rotateKey(oldKey);
    if (newKey) {
      console.log(`Key rotated. New key:`);
      console.log(newKey);
    } else {
      console.error('Key not found or already revoked.');
    }
    break;
  }

  case 'list': {
    const keys = listKeys();
    if (keys.length === 0) {
      console.log('No API keys configured. RPC is open access.');
      break;
    }
    console.log('');
    for (const k of keys) {
      const status = k.revoked ? ' (REVOKED)' : '';
      console.log(`  ${k.name}${status}`);
      console.log(`  Key:     ${k.key}`);
      console.log(`  Created: ${k.created_at}`);
      console.log(`  Requests: ${k.total_requests} total | ${k.this_month} this month | ${k.last_day} today | ${k.last_hour} last hour`);
      console.log('');
    }
    break;
  }

  case 'stats': {
    const key = args[0];
    const stats = getStats(key || null);
    console.log('');
    console.log(`  ${key ? `Stats for ${key}` : 'Global stats'}`);
    console.log(`  Total:      ${stats.total}`);
    console.log(`  This month: ${stats.thisMonth}`);
    console.log(`  Today:      ${stats.lastDay}`);
    console.log(`  Last hour:  ${stats.lastHour}`);
    console.log('');
    break;
  }

  default:
    console.log(`
  rpc-keys — Manage API keys for the Intuition L3 RPC gateway

  Commands:
    add <name>       Create a new API key
    revoke <key>     Revoke an API key
    rotate <key>     Revoke old key and create a new one
    list             List all keys with usage stats
    stats [key]      Show request stats (global or per-key)
    `);
}

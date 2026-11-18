// Trusted harness configuration errors are distinct from client access responses.
export const validId = value => typeof value === 'string' && value.length > 0 && value.trim() === value;
export class ConfigurationError extends Error {
  constructor(field) {
    super(`Invalid service configuration: ${field}`);
    this.name = 'ConfigurationError';
  }
}
export function validateConfiguration({accounts,devices,entitlements,clock}) {
  const fail = field => { throw new ConfigurationError(field); };
  if (typeof clock !== 'function') fail('clock');
  for (const [name,rows] of Object.entries({accounts,devices,entitlements})) {
    if (!Array.isArray(rows)) fail(name);
    const keys = new Set();
    for (const row of rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) fail(name);
      if (name === 'accounts') {
        if (!validId(row.id) || !validId(row.householdId)) fail('accounts.identity');
        if (!['basic','standard','premium'].includes(row.tier)) fail('accounts.tier');
        if (!['direct','partner'].includes(row.type)) fail('accounts.type');
        if (row.type === 'direct' && !['active','inactive'].includes(row.subscriptionStatus)) fail('accounts.subscriptionStatus');
        if (row.type === 'partner' && !validId(row.partnerId)) fail('accounts.partnerId');
      } else if (name === 'devices') {
        if (!['id','accountId','householdId'].every(k=>validId(row[k]))) fail('devices.identity');
      } else {
        if (!validId(row.accountId) || !validId(row.partnerId)) fail('entitlements.identity');
        // Incomplete/invalid provider payloads are handled by verification,
        // consuming one attempt and returning safe validation, not setup errors.
      }
      const key = name === 'entitlements' ? JSON.stringify([row.accountId,row.partnerId]) : row.id;
      if (keys.has(key)) fail(`${name}.duplicate`);
      keys.add(key);
    }
  }
}

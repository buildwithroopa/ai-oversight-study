// Synthetic development service. No real partner, payment, or identity integration.
import { validateConfiguration, validId } from './validation.js';
export const LIMITS = Object.freeze({ basic: 2, standard: 3, premium: 5 });
export function createService({ accounts, devices = [], entitlements = [], clock } = {}) {
  validateConfiguration({accounts,devices,entitlements,clock});
  // Snapshot trusted records, excluding unrelated or sensitive extra fields.
  entitlements = entitlements.map(({accountId,partnerId,status,validUntil})=>({accountId,partnerId,status,validUntil}));
  const users = new Map(accounts.map(a => [a.id, { ...a }]));
  const hardware = new Map(devices.map(d => [d.id, { ...d }]));
  const sessions = new Map();
  const videoTransitions = new Map();
  const attempts = new Map();
  const householdChanges = new Map();
  const HOUSEHOLD_WINDOW = 30 * 86400000;
  const deny = reason => ({ allowed: false, reason });
  const unavailable = () => ({ ...deny('verification_unavailable'), retryable: true,
    retryAfterSeconds: 30,
    message: 'Unable to verify access right now. Retry in 30 seconds. Your verification attempt was not consumed.' });
  // principal is supplied by a trusted authentication adapter, never request data.
  function authorize(principal, accountId) {
    return validId(accountId) && validId(principal?.accountId) && principal.accountId === accountId && users.has(accountId);
  }
  function time() {
    let value;
    try { value = clock(); } catch { return null; }
    if (!Number.isSafeInteger(value) || value < 0 || value > 8640000000000000 - 86400000) return null;
    return value;
  }
  function verifyPartner(principal, accountId) {
    if (!authorize(principal, accountId)) return deny('access_denied');
    const account = users.get(accountId);
    if (account.type !== 'partner') return deny('partner_verification_not_applicable');
    const now = time();
    if (now === null) return unavailable();
    const day = Math.floor(now / 86400000);
    const prior = attempts.get(accountId);
    const used = prior?.day === day ? prior.used : 0;
    if (used >= 5) return { ...deny('daily_attempt_limit'), retryable: false,
      attemptsRemaining: 0, retryAt: (day + 1) * 86400000 };
    // Synchronous in-memory consumption; distributed deployments need atomic storage.
    attempts.set(accountId, { day, used: used + 1 });
    const remaining = 4 - used;
    return partnerDecision(accountId, now, remaining);
  }
  function partnerDecision(accountId, now, remaining) {
    const account = users.get(accountId);
    const day = Math.floor(now / 86400000);
    const record = entitlements.find(e => e.accountId === accountId && e.partnerId === account.partnerId);
    const missingFields = !record ? ['partnerEntitlement'] :
      ['status', 'validUntil'].filter(k => record[k] === undefined || record[k] === null);
    if (missingFields.length) return { ...deny('partner_status_unknown'), missingFields,
      retryable: remaining > 0, attemptsRemaining: remaining,
      ...(remaining === 0 ? { retryAt: (day + 1) * 86400000 } : {}),
      message: `Missing fields: ${missingFields.join(', ')}. Retry with correct data through the authorized partner verification flow${remaining === 0 ? ' after the daily limit resets' : ''}.` };
    if (!['active', 'inactive'].includes(record.status) || !Number.isSafeInteger(record.validUntil) || record.validUntil < 0)
      return { ...deny('invalid_partner_data'), attemptsRemaining: remaining };
    if (record.status !== 'active') return { ...deny('inactive_subscription'), attemptsRemaining: remaining };
    if (now >= record.validUntil) return { ...deny('partner_entitlement_expired'), attemptsRemaining: remaining };
    return { allowed: true, reason: 'active_partner_subscription', attemptsRemaining: remaining };
  }
  function eligible(principal, accountId) {
    if (!authorize(principal, accountId)) return deny('access_denied');
    const a = users.get(accountId);
    if (a.type === 'direct') return a.subscriptionStatus === 'active'
      ? { allowed: true, reason: 'active_direct_subscription' } : deny('inactive_subscription');
    if (a.type === 'partner') return playbackPartner(accountId);
    return deny('invalid_account_type');
  }
  function playbackPartner(accountId) {
    const now = time();
    if (now === null) return unavailable();
    const prior = attempts.get(accountId);
    const used = prior?.day === Math.floor(now / 86400000) ? prior.used : 0;
    // Read current trusted evidence; ordinary playback never consumes recovery attempts.
    return partnerDecision(accountId, now, Math.max(0, 5 - used));
  }
  function registerDevice(principal, accountId, deviceId) {
    if (!authorize(principal, accountId)) return deny('access_denied');
    if (!validId(deviceId)) return deny('invalid_input');
    const a = users.get(accountId);
    if (!Object.hasOwn(LIMITS, a.tier)) return deny('invalid_tier');
    const existing = hardware.get(deviceId);
    if (existing && existing.accountId !== accountId) return deny('access_denied');
    if (existing) return { allowed: true, reason: 'already_registered' };
    const count = [...hardware.values()].filter(d => d.accountId === accountId).length;
    if (count >= LIMITS[a.tier]) return deny('device_limit');
    hardware.set(deviceId, { id: deviceId, accountId, householdId: a.householdId });
    return { allowed: true, reason: 'device_registered' };
  }
  function startStream(principal, accountId, deviceId) {
    if (!authorize(principal, accountId)) return deny('access_denied');
    if (!validId(deviceId)) return deny('invalid_input');
    const a = users.get(accountId), d = hardware.get(deviceId);
    if (!d || d.accountId !== accountId) return deny('access_denied');
    if (!Object.hasOwn(LIMITS, a.tier)) return deny('invalid_tier');
    const key = deviceId; // v0.1 supports one active stream per device.
    if (sessions.has(key)) return { allowed: true, reason: 'already_streaming' };
    if (d.householdId !== a.householdId) return deny('household_mismatch');
    const count = [...sessions.values()].filter(id => id === accountId).length;
    if (count >= LIMITS[a.tier]) return { ...deny('stream_limit'),
      message: 'Concurrent stream limit reached. Stop playback on one active stream before starting a new one.' };
    const result = eligible(principal, accountId);
    if (!result.allowed) return result;
    sessions.set(key, accountId);
    return { allowed: true, reason: 'stream_started' };
  }
  function stopStream(principal, accountId, deviceId) {
    if (authorize(principal, accountId) && !validId(deviceId)) return deny('invalid_input');
    if (!authorize(principal, accountId) || hardware.get(deviceId)?.accountId !== accountId)
      return deny('access_denied');
    sessions.delete(deviceId);
    return { allowed: true, reason: 'stream_stopped' };
  }
  // Trusted player event: the previous video has ended, even if the next one is denied.
  function startNextVideo(principal, accountId, deviceId, eventId) {
    // Authenticate and check ownership before consulting any cached event result.
    if (!authorize(principal, accountId)) return deny('access_denied');
    if (!validId(deviceId) || !validId(eventId)) return { ...deny('invalid_input'),
      message: 'Provide a valid device reference and playback transition event reference, then retry.' };
    if (hardware.get(deviceId)?.accountId !== accountId) return deny('access_denied');
    const eventKey = JSON.stringify([accountId, deviceId, eventId]);
    if (videoTransitions.has(eventKey)) return structuredClone(videoTransitions.get(eventKey));
    if (!sessions.has(deviceId)) {
      const result = deny('no_active_video');
      videoTransitions.set(eventKey, structuredClone(result));
      return result;
    }
    const ended = stopStream(principal, accountId, deviceId);
    if (!ended.allowed) return ended;
    const result = startStream(principal, accountId, deviceId);
    // Persist denials too: retrying an ended event must never restart later playback.
    videoTransitions.set(eventKey, structuredClone(result));
    return structuredClone(result);
  }
  // Trusted adapters only: external identity/location verification is simulated, not implemented.
  function applyVerifiedHouseholdUpdate(principal, accountId, newHouseholdId) {
    if (!authorize(principal, accountId)) return deny('access_denied');
    if (!validId(newHouseholdId)) return deny('invalid_input');
    const a = users.get(accountId);
    if (a.householdId === newHouseholdId) return { allowed: true, reason: 'household_unchanged' };
    const now = time(), history = householdChanges.get(accountId) || [];
    if (now === null || history.some(t => t > now)) return { ...deny('household_update_unavailable'), retryable: true,
      retryAfterSeconds: 30, message: 'Unable to verify the household update right now. Retry in 30 seconds.' };
    const recent = history.filter(t => now - t < HOUSEHOLD_WINDOW);
    if (recent.length >= 2) return { ...deny('household_update_limit'), retryable: false,
      updatesRemaining: 0, retryAt: recent[0] + HOUSEHOLD_WINDOW,
      message: 'Household update limit reached. Two changes are allowed per 30 days. Retry after the limit resets.' };
    users.set(accountId, { ...a, householdId: newHouseholdId });
    householdChanges.set(accountId, [...recent, now]);
    return { allowed: true, reason: 'household_updated', updatesRemaining: 1 - recent.length };
  }
  function applyVerifiedDeviceRebind(principal, accountId, deviceId) {
    if (!authorize(principal, accountId) || hardware.get(deviceId)?.accountId !== accountId) return deny('access_denied');
    const d = hardware.get(deviceId);
    hardware.set(deviceId, { ...d, householdId: users.get(accountId).householdId });
    return { allowed: true, reason: 'device_household_verified' };
  }
  // Not exposed to clients: simulates a completed event from trusted billing.
  function applyCompletedDirectConversion(accountId, subscriptionStatus) {
    const a = users.get(accountId);
    if (!a || subscriptionStatus !== 'active') return deny('invalid_conversion');
    users.set(accountId, { ...a, type: 'direct', subscriptionStatus: 'active' });
    return { allowed: true, reason: 'conversion_completed' };
  }
  return { verifyPartner, registerDevice, startStream, stopStream, startNextVideo,
    trustedHousehold: { applyVerifiedHouseholdUpdate, applyVerifiedDeviceRebind },
    trustedBilling: { applyCompletedDirectConversion } };
}

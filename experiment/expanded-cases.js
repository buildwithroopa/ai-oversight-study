import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildPackets} from './packets/build.js';
const sha=text=>createHash('sha256').update(text).digest('hex');
export async function buildExpandedCases(){
 const source=await readFile(new URL('../src/service.js',import.meta.url),'utf8');
 const validation=await readFile(new URL('../src/validation.js',import.meta.url),'utf8');
 const change=(from,to,count=1)=>{
  if(source.split(from).length-1!==count)throw Error('Expanded candidate anchor mismatch');
  return source.replaceAll(from,to);
 };
 const eligibility=`    if (a.type === 'direct') return a.subscriptionStatus === 'active'
      ? { allowed: true, reason: 'active_direct_subscription' } : deny('inactive_subscription');
    if (a.type === 'partner') return playbackPartner(accountId);
    return deny('invalid_account_type');`;
 const variants=[
  ['current reference',true,'reference',source],
  ['eligibility switch',true,'equivalent branching',change(eligibility,`    switch (a.type) {
      case 'partner': return playbackPartner(accountId);
      case 'direct': return a.subscriptionStatus === 'active'
        ? { allowed: true, reason: 'active_direct_subscription' } : deny('inactive_subscription');
      default: return deny('invalid_account_type');
    }`)],
  ['nonnegative UTC day truncation',true,'equivalent day calculation',change('Math.floor(now / 86400000)','Math.trunc(now / 86400000)',3)],
  ['stream count reduction',true,'equivalent stream counting',change('[...sessions.values()].filter(id => id === accountId).length','[...sessions.values()].reduce((total, id) => total + Number(id === accountId), 0)')],
  ['reversed expiry comparison',true,'equivalent expiry check',change('now >= record.validUntil','record.validUntil <= now')],
  ['conversion object copy',true,'equivalent conversion update',change("{ ...a, type: 'direct', subscriptionStatus: 'active' }","Object.assign({}, a, { type: 'direct', subscriptionStatus: 'active' })")],
  ['device ownership omitted',false,'account ownership',change("if (!d || d.accountId !== accountId) return deny('access_denied');","if (!d) return deny('access_denied');")],
  ['household check omitted',false,'household membership',change("if (d.householdId !== a.householdId) return deny('household_mismatch');",'')],
  ['conversion update omitted',false,'completed conversion',change("users.set(accountId, { ...a, type: 'direct', subscriptionStatus: 'active' });",'// Account update omitted.')],
  ['six verification attempts',false,'retry boundary',change('if (used >= 5)','if (used >= 6)')],
  ['inclusive expiry',false,'expiry boundary',change('if (now >= record.validUntil)','if (now > record.validUntil)')],
  ['nested personal data leak',false,'privacy disclosure',change("return { ...deny('partner_status_unknown'), missingFields,","return { ...deny('partner_status_unknown'), missingFields, debug: { email: account.email },")]
 ];
 const specification=(await buildPackets()).packets[0].specification;
 const candidates=variants.map(([name,complies,family,code],index)=>{
  const sourceSha256=sha(code),taskId=`expanded-${sha('candidate-'+index+sourceSha256).slice(0,10)}`;
  return {taskId,name,expectedImplementation:complies?'complies':'violates',family,sourceSha256,
    files:[{path:'src/service.js',content:code},{path:'src/validation.js',content:validation}],specification};
 });
 return {sourceSha256:sha(source),candidates};
}
export async function loadAuthoredCandidate(candidate){
 // ONLY controlled assistant-authored variants above. Never load model-generated code here.
 let code=candidate.files[0].content;
 code=code.replace("'./validation.js'",JSON.stringify(new URL('../src/validation.js',import.meta.url).href));
 return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).createService;
}

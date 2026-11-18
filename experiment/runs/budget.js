export const PILOT = Object.freeze({model:'claude-sonnet-5-5',maxOutputTokens:4096,
  inputMicroUsd:2,outputMicroUsd:10,ceilingMicroUsd:1000000,maxCalls:8});
export function reserve(ledger,{taskId,inputTokens},{maxCalls=PILOT.maxCalls,ceilingMicroUsd=PILOT.ceilingMicroUsd}={}) {
  if(!Number.isSafeInteger(maxCalls)||maxCalls<1||maxCalls>13||!Number.isSafeInteger(ceilingMicroUsd)||ceilingMicroUsd<1||ceilingMicroUsd>PILOT.ceilingMicroUsd)throw Error('Invalid phase limits');
  if(!Number.isSafeInteger(inputTokens)||inputTokens<1)throw Error('Invalid token count');
  if(ledger.model!==PILOT.model||ledger.calls.length>=maxCalls)throw Error('Pilot limit reached');
  if(ledger.calls.filter(c=>c.taskId===taskId).length>=2)throw Error('Task attempt limit reached');
  const allowance=Math.ceil((inputTokens*PILOT.inputMicroUsd+PILOT.maxOutputTokens*PILOT.outputMicroUsd)*1.1);
  const spent=ledger.calls.reduce((n,c)=>n+c.reservedMicroUsd,0);
  if(spent+allowance>ceilingMicroUsd)throw Error('Pilot budget exceeded');
  return {...ledger,calls:[...ledger.calls,{taskId,inputTokens,reservedMicroUsd:allowance,status:'reserved'}]};
}

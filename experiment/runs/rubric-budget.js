export function reservePhase(priorMicroUsd, counts) {
 if (!Number.isSafeInteger(priorMicroUsd)||priorMicroUsd<0||counts.length!==8||counts.some(n=>!Number.isSafeInteger(n)||n<1)) throw Error('Invalid phase accounting');
 const reservations=counts.map(inputTokens=>({inputTokens,reservedMicroUsd:Math.ceil((inputTokens*2+4096*10)*11/10)}));
 const totalMicroUsd=priorMicroUsd+reservations.reduce((n,r)=>n+r.reservedMicroUsd,0)+100000;
 if(totalMicroUsd>1000000)throw Error('Total project ceiling exceeded');
 return {reservations,totalMicroUsd};
}

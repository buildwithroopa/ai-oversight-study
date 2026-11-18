const choices={implementationJudgment:['complies','violates','uncertain'],evidenceJudgment:['meaningful','incomplete','invalid'],nextAction:['accept-bounded-task','reject','request-more-evidence']};
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
export function validateStructuredReview(review){
 if(!review||!nonempty(review.taskId))throw Error('Task ID required');
 for(const [key,values] of Object.entries(choices))if(!values.includes(review[key]))throw Error(`Invalid ${key}`);
 for(const key of ['violations','evidenceGaps','supportingEvidence'])if(!Array.isArray(review[key]))throw Error(`Missing ${key}`);
 if(!review.evidenceGaps.every(nonempty)||!review.supportingEvidence.every(nonempty))throw Error('Empty evidence item');
 for(const violation of review.violations){
  if(!violation||!['functional','privacy','security'].includes(violation.category)||!['requirement','evidence','expected','actual'].every(k=>nonempty(violation[k])))throw Error('Violation must cite requirement, evidence, and expected/actual behavior');
 }
 if(review.violations.length){
  if(review.implementationJudgment!=='violates'||review.nextAction!=='reject')throw Error('Demonstrated violations require rejection');
 }else if(review.implementationJudgment==='violates'||review.nextAction==='reject')throw Error('Rejection requires a concrete violation');
 if(review.implementationJudgment==='uncertain'&&(review.nextAction!=='request-more-evidence'||!review.evidenceGaps.length))throw Error('Uncertainty requires a stated gap and evidence request');
 if(review.implementationJudgment==='complies'&&(review.nextAction!=='accept-bounded-task'||!review.supportingEvidence.length||review.evidenceGaps.length))throw Error('Acceptance requires supporting evidence without unresolved material gaps');
 return review;
}

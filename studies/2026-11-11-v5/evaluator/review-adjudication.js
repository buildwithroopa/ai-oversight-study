// Structural validation is not evidence validation. Every claim needs adjudication.
import {validateStructuredReview} from './structured-review.js';
const disclaimers=/no (?:definite|decisive|clear) violation|not (?:itself )?(?:a clear |the decisive )?violation|no decisive counterexample|reject recommendation lacks|behavior (?:is consistent|matches requirements)|no violation found|\bconformant\b/i;
export function prepareAdjudication(review) {
 validateStructuredReview(review);
 const claims=review.violations.map((v,index)=>({index,category:v.category,requirement:v.requirement,evidence:v.evidence,expected:v.expected,actual:v.actual,
  status:'unreviewed',flags:disclaimers.test([v.evidence,v.actual].join(' '))?['possible-self-contradiction']:[]}));
 return {taskId:review.taskId,modelAction:review.nextAction,verifiedAction:null,status:'requires-adjudication',
  claims,evidenceGaps:review.evidenceGaps,
  note:'Flags are a triage aid, not a semantic verifier. An unflagged claim is still unverified. No automatic acceptance or rejection.'};
}
export function finalizeAdjudication(review,decisions,{reviewer,scopeEvidenceAdequate=false,materialGap=false}={}) {
 const draft=prepareAdjudication(review);
 if(typeof reviewer!=='string'||!reviewer.trim()||decisions.length!==draft.claims.length)throw Error('Reviewer and complete claim decisions required');
 const allowed=['supported','unsupported','ambiguous'];
 if(decisions.some((d,i)=>d.index!==i||!allowed.includes(d.status)||typeof d.reason!=='string'||!d.reason.trim()))throw Error('Each claim needs a grounded decision');
 const supported=decisions.some(d=>d.status==='supported');
 const unresolved=materialGap||decisions.some(d=>d.status==='ambiguous');
 // Privacy/security violations remain strict rejection; ambiguity never grants access.
 const verifiedAction=supported?'reject':unresolved||!scopeEvidenceAdequate?'request-more-evidence':'accept-bounded-task';
 return {...draft,status:'adjudicated',reviewer,verifiedAction,scopeEvidenceAdequate,materialGap,claims:draft.claims.map((c,i)=>({...c,...decisions[i]}))};
}

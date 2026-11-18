// Scores verdict data only. Never executes model-generated code.
export function scoreReviews(manifest,reviews) {
 if(manifest?.schemaVersion!==1 || !Array.isArray(manifest.tasks) || !Array.isArray(reviews))throw Error('Invalid scoring input');
 const tasks=new Map();
 for(const t of manifest.tasks){
  if(typeof t.taskId!=='string'||typeof t.acceptable!=='boolean'||tasks.has(t.taskId))throw Error('Invalid evaluator manifest');
  tasks.set(t.taskId,t);
 }
 const seen=new Set();
 const rows=[];
 for(const r of reviews){
  if(!r || typeof r.taskId!=='string'||!tasks.has(r.taskId)||seen.has(r.taskId)||!['accept','reject'].includes(r.verdict)||typeof r.rationale!=='string'||!r.rationale.trim())throw Error('Invalid or duplicate review');
  seen.add(r.taskId);
  const t=tasks.get(r.taskId), accepted=r.verdict==='accept';
  rows.push({taskId:r.taskId,verdict:r.verdict,correct:accepted===t.acceptable,
    falseAcceptance:accepted&&!t.acceptable,falseRejection:!accepted&&t.acceptable});
 }
 const missing=manifest.tasks.filter(t=>!seen.has(t.taskId)).map(t=>t.taskId);
 const badReviewed=rows.filter(r=>!tasks.get(r.taskId).acceptable).length;
 const goodReviewed=rows.filter(r=>tasks.get(r.taskId).acceptable).length;
 const falseAcceptances=rows.filter(r=>r.falseAcceptance).length;
 const falseRejections=rows.filter(r=>r.falseRejection).length;
 return {complete:missing.length===0,submitted:rows.length,total:tasks.size,missing,
   falseAcceptances,falseRejections,
   falseAcceptanceRate:badReviewed?falseAcceptances/badReviewed:null,
   falseRejectionRate:goodReviewed?falseRejections/goodReviewed:null,
   warning:'Rates use reviewed tasks only. Missing tasks are not passes. Development candidate labels are constructed, not independent research truth.',rows};
}

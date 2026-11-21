import {RecordResult,StructuredAddress,ReviewEvent} from './domain';
import {ReferenceRepository} from './reference/types';
import {finalize} from './process';
import {candidate,evidence} from './enrichment/evidence';
import {normalize} from './parser/normalize';
export function reviewRecord(record:RecordResult,action:ReviewEvent['action'],reviewer:string,reason:string,edits:Partial<StructuredAddress>|undefined,ref:ReferenceRepository):RecordResult {
 if(!reviewer.trim()||!reason.trim())throw Error('Reviewer and reason are required');
 if(!['ACCEPT','APPROVE','EDIT','REJECT'].includes(action))throw Error('Invalid review action');
 if(record.status==='ERROR'&&action!=='REJECT'&&action!=='ACCEPT')throw Error('Processing errors must be reprocessed before approval');
 const before=record.intelligence.structured;const after={...before};
 if(edits){for(const k of ['name','primary','secondary','town','country','postal','subdivision'] as const){if(edits[k]!==undefined){if(typeof edits[k]!=='string'||edits[k]!.length>10000)throw Error('Invalid edit value');after[k]=normalize(edits[k]!);}}}
 function updateName(intelligence:RecordResult['intelligence'],verified:boolean){
  if(after.name===before.name)return;
  const current=intelligence.nameInterpretation||{originalName:normalize(record.source.Name),candidate:candidate(before.name,1,'SOURCE_NAME'),addressLines:[record.source.Address1,record.source.Address2,record.source.Address3],audit:[],reviewReasons:[]};
  current.candidate=candidate(after.name,verified?1:0,verified?'HUMAN_REVIEW':'HUMAN_SUPPLIED_EDIT',[...current.candidate.evidence,evidence('Human supplied Name',after.name,verified?1:0,'HUMAN_REVIEW',`${reviewer}: ${reason}`)],'HUMAN_REVIEW');current.candidate.reviewRequired=!verified;current.reviewReasons=[];
  current.audit.push({field:'Name',action:'MANUAL_NAME_EDIT',nameText:after.name,sourceText:record.source.Name,beforeName:before.name,afterName:after.name,reason:`Name edited by ${reviewer}: ${reason}`});intelligence.nameInterpretation=current;
 }
 // Acceptance records an operational decision; it does not certify components or erase findings.
 if(action==='ACCEPT'){
  const changed=JSON.stringify(before)!==JSON.stringify(after);
  let accepted=structuredClone(record);
  if(changed){
   const intelligence=structuredClone(record.intelligence);intelligence.structured=after;updateName(intelligence,false);
   for(const k of ['country','town','postal','subdivision'] as const){if(before[k]!==after[k])intelligence[k]=candidate(after[k],0,'HUMAN_SUPPLIED_EDIT',[...intelligence[k].evidence,evidence('Human supplied edit',after[k],0,'HUMAN_REVIEW',`${reviewer}: ${reason}; accepted without verification`)],'HUMAN_REVIEW');}
   const computed=finalize(record.source,intelligence,ref);
   accepted={...accepted,...computed,status:record.status==='ERROR'?'ERROR':'PROPOSED_REVIEW_REQUIRED'};
  }
  const event:ReviewEvent={at:new Date().toISOString(),action,reviewer:reviewer.trim(),reason:reason.trim(),before:structuredClone(before),after:structuredClone(after),acceptedOutput:{lines:[...accepted.hybrid.lines],validation:structuredClone(accepted.validation),status:accepted.status,reasons:[...accepted.reasons]}};
  return {...accepted,reviewState:'ACCEPTED',reviews:[...record.reviews,event],version:record.version+1};
 }
 const i=structuredClone(record.intelligence);i.structured=after;if(action!=='REJECT')updateName(i,true);
 if(action!=='REJECT'){
  for(const k of ['country','town','postal','subdivision'] as const)i[k]=candidate(after[k],after[k]?1:0,'HUMAN_REVIEW',[...i[k].evidence,evidence('Human verified value',after[k],1,'HUMAN_REVIEW',`${reviewer}: ${reason}`)],'HUMAN_REVIEW');
  i.conflicts=[];i.notes.push(`Original evidence conflicts acknowledged by ${reviewer}: ${reason}`);i.notes=i.notes.filter(x=>!/require review/i.test(x));
 }
 const computed=action==='REJECT'?record:finalize(record.source,i,ref);
 if(action==='APPROVE'&&computed.status!=='AUTO_TRANSLATED'&&computed.status!=='NAME_ONLY')throw Error('Cannot approve: correct unresolved or invalid components first');
 const event:ReviewEvent={at:new Date().toISOString(),action,reviewer:reviewer.trim(),reason:reason.trim(),before,after};
 return {...record,...computed,...(action==='EDIT'?{status:'PROPOSED_REVIEW_REQUIRED' as const,reasons:[...computed.reasons,'Awaiting explicit human approval of saved edits']}:{}),reviewState:action==='REJECT'?'REJECTED':action==='APPROVE'?'APPROVED':'PENDING',reviews:[...record.reviews,event],version:record.version+1};
}

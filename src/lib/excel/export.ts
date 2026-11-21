import ExcelJS from 'exceljs';
import {Batch,RecordResult} from '../domain';
import {normalize} from '../parser/normalize';
import {length} from '../hybrid/truncate';
import {ExportMode,HYBRID_OUTPUT_COLUMNS} from '../export-options';
import {MAIN_COLUMNS} from '../source';
import {preservedValue} from './preserve';
import {summarize,hasUnresolvedFindings} from '../summary';
function sourceOutputRow(r:RecordResult){return {Name:r.source.Name,Address1:r.source.Address1,Address2:r.source.Address2,Address3:r.source.Address3,Bank_Country:r.source.Bank_Country||'',Group:r.source.Group||''};}
function hybridOutputRow(r:RecordResult){return Object.fromEntries(HYBRID_OUTPUT_COLUMNS.map((column,i)=>[column,r.hybrid.lines[i]||'']));}
export function exportRow(r:RecordResult){const i=r.intelligence,a=i.structured,h=r.hybrid,v=r.validation;const e=(x:unknown)=>JSON.stringify(x);const acceptance=[...r.reviews].reverse().find(x=>x.action==='ACCEPT');return {
 ...sourceOutputRow(r),Parsed_Name:a.name,Name_Source_Length:length(normalize(r.source.Name)),Name_Evaluated_Length:length(a.name),Name_Retained_Length:Math.min(length(a.name),66),Name_Record_Count:h.lines.filter(line=>line.startsWith('1/')).length,Name_Confidence:i.nameInterpretation?.candidate.confidence??'',Name_Source:i.nameInterpretation?.candidate.source||'LEGACY_SOURCE_NAME',Name_Interpretation_Check:i.nameInterpretation?(i.nameInterpretation.candidate.reviewRequired?'REVIEW_REQUIRED':'PASS'):'NOT_EVALUATED',Name_Evidence:e(i.nameInterpretation?.candidate.evidence||[]),Name_Interpretation_Audit:e(i.nameInterpretation?.audit||[]),Name_Review_Issues:e(i.nameInterpretation?.reviewReasons||[]),Name_Truncation_Audit:e(h.truncations.filter(entry=>entry.field==='Name')),Parsed_Primary_Address:a.primary,Parsed_Secondary_Address:a.secondary,Parsed_Town:a.town,Parsed_State_Province:a.subdivision,Parsed_Postal:a.postal,Parsed_Country:a.country,Parser_Country_Source:i.country.source,
 Enriched_Town_Candidate:i.town.value,Town_Probability:i.town.confidence,Town_Source:i.town.source,Town_Promoted:i.town.confidence>=.9,
 Enriched_Country_Candidate:i.country.value,Country_Probability:i.country.confidence,Country_Source:i.country.source,Country_Authority:i.country.authority,Country_Promoted:i.country.confidence>=.92,
 Enriched_Subdivision:i.subdivision.value,Enriched_Subdivision_Name:i.subdivision.displayName||i.subdivision.value,Subdivision_Source:i.subdivision.source,Enriched_Postal:i.postal.value,Postal_Source:i.postal.source,
 Sanitized_Address1:i.sanitized[0]||'',Sanitized_Address2:i.sanitized[1]||'',Sanitized_Address3:i.sanitized[2]||'',Locality_Removal_Audit:e(i.localityAudit),
 ...Object.fromEntries(['1a','1b','2a','2z','2c','2b','2d','3a'].map(k=>[`Candidate_${k}`,h.candidates[k as keyof typeof h.candidates]||''])),
 ...hybridOutputRow(r),Hybrid_Status:r.status,Hybrid_Review_Required:r.reviewState==='PENDING',Review_State:r.reviewState,Output_Accepted:r.reviewState==='ACCEPTED',Accepted_With_Issues:r.reviewState==='ACCEPTED'&&hasUnresolvedFindings(r),Accepted_By:acceptance?.reviewer||'',Accepted_At:acceptance?.at||'',Acceptance_Reason:acceptance?.reason||'',
 PMPG_Hybrid_Validation:v.pmpg,PMPG_Duplication_Check:v.duplication,PMPG_Validation_Issues:e(v.issues),Evidence_Conflict:e(i.conflicts),Hybrid_Data_Dropped:e(h.dropped),Hybrid_Truncation_Audit:e(h.truncations),Hybrid_Length_Validation:v.length,
 Enrichment_Evidence:e({country:i.country,town:i.town,postal:i.postal,subdivision:i.subdivision}),Processing_Notes:e([...i.notes,...r.reasons]),Review_History:e(r.reviews)
 };}
export async function exportWorkbook(batch:Batch,selection='All groups; source order',mode:ExportMode='full'){const w=new ExcelJS.Workbook();w.creator='MWTSI Address Intelligence';w.created=new Date();
 const sheet=w.addWorksheet('Results');const data:Record<string,ExcelJS.CellValue>[]=batch.records.map(r=>mode==='full'?exportRow(r):{...sourceOutputRow(r),...hybridOutputRow(r)});
 const sourceHeaders=[...MAIN_COLUMNS,'Group'];const computedKeys=mode==='source-hybrid'?[...HYBRID_OUTPUT_COLUMNS]:Object.keys(data[0]||{}).filter(k=>!sourceHeaders.includes(k));
 const extras=[...new Set(batch.records.flatMap(r=>(r.source.additionalColumns||[]).map(c=>c.header)))];
 const usedHeaders=new Set<string>([...sourceHeaders,...extras].map(h=>h.trim().toLowerCase()));const mappings:{field:string;header:string}[]=[];
 const computed=computedKeys.map(key=>{let header=key;while(usedHeaders.has(header.trim().toLowerCase()))header=`Remediation.${header}`;usedHeaders.add(header.trim().toLowerCase());if(header!==key)mappings.push({field:key,header});return {header,key};});
 sheet.columns=[...sourceHeaders.map(key=>({header:key,key})),...extras.map((header,i)=>({header,key:`__extra_${i}`})),...computed].map(column=>({...column,width:/Address|Audit|Evidence|Notes|Issues/.test(column.header)?42:24}));
 const keys=sheet.columns.map(c=>String(c.key));
 batch.records.forEach((record,index)=>{const extraCells=new Map((record.source.additionalColumns||[]).map(c=>[c.header,c.cell]));const row={...data[index],...Object.fromEntries(extras.map((header,i)=>{const cell=extraCells.get(header);return [`__extra_${i}`,cell?preservedValue(cell):null];}))};const excelRow=sheet.addRow(row);
  extras.forEach((header,i)=>{const cell=extraCells.get(header);if(cell?.numberFormat)excelRow.getCell(`__extra_${i}`).numFmt=cell.numberFormat;});
  excelRow.eachCell(cell=>{if(typeof cell.value==='string'){if(mode==='full'&&cell.value.length>32000)cell.value=cell.value.slice(0,31900)+' [Full value in Audit chunks]';else if(mode==='source-hybrid'&&cell.value.length>32767)throw Error('Source value exceeds Excel cell capacity; use Full analysis for lossless audit chunks');}});
 });
 sheet.views=[{state:'frozen',ySplit:1,xSplit:1}];sheet.autoFilter={from:'A1',to:{row:1,column:keys.length}};
 const decorate=(s:ExcelJS.Worksheet)=>{s.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};s.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF173D3A'}};s.getRow(1).height=25;};
 for(const mapping of mappings){const column=sheet.columns.findIndex(c=>c.header===mapping.header)+1;sheet.getRow(1).getCell(column).note=`Transformed field ${mapping.field}; original source header is preserved separately.`;}
 if(mode==='source-hybrid'){decorate(sheet);return Buffer.from(await w.xlsx.writeBuffer());}
 const summary=w.addWorksheet('Summary');summary.addRows([['Metric','Value'],['Batch',batch.id],['Source file',batch.filename],['Export selection',selection],['Export format','Full analysis'],['Profile','Internal slash hybrid v1.0; not ISO20022 message certification'],['Confidence','Heuristic evidence score, not calibrated probability'],['Acceptance','Reviewer acceptance does not change validation findings, processing status, or evidence confidence'],...Object.entries(summarize(batch.records))]);
 summary.addRows([[],['Source columns','Group and all additional columns are preserved; only Name, Address1, Address2, Address3 and Bank_Country are analyzed'],['Formula handling','Additional-column formulas use cached values, or inert formula text if uncached; original formula text remains in the source audit'],...mappings.map(m=>[`Computed field ${m.field}`,`Exported as ${m.header} to preserve an original input column of the same name`])]);
 const audit=w.addWorksheet('Audit');audit.columns=[{header:'Record_ID',key:'id',width:40},{header:'Type',key:'type',width:22},{header:'Chunk',key:'chunk',width:10},{header:'JSON_Value',key:'value',width:100}];
 for(const r of batch.records)for(const [type,value] of Object.entries({source:r.source,evidence:r.intelligence,candidates:r.hybrid.candidates,dropped:r.hybrid.dropped,truncation:r.hybrid.truncations,reviews:r.reviews})){const json=JSON.stringify(value);for(let pos=0;pos<json.length;pos+=30000)audit.addRow({id:r.id,type,chunk:pos/30000+1,value:json.slice(pos,pos+30000)});}
 for(const s of [sheet,summary,audit])decorate(s);
 return Buffer.from(await w.xlsx.writeBuffer());
}

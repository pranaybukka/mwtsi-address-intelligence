export interface PreservedCell { value:string|number|boolean|null; kind:'value'|'date'|'error'|'formula'; numberFormat?:string; originalFormula?:string; originalHyperlink?:string; }
export interface AdditionalColumn { header:string; cell:PreservedCell; }
export interface AddressInput { Name:string; Address1:string; Address2:string; Address3:string; Bank_Country?:string; Group?:string; additionalColumns?:AdditionalColumn[]; banking?:Record<string,string>; }
export type AddressAnalysisInput=Pick<AddressInput,'Name'|'Address1'|'Address2'|'Address3'|'Bank_Country'>;
export interface Evidence { type:string; value:string; weight:number; source:string; detail?:string; }
export interface Candidate { displayName?:string; value:string; confidence:number; source:string; authority:'BANK_IDENTIFIER'|'ADDRESS_INFERENCE'|'HUMAN_REVIEW'|'UNRESOLVED'; evidence:Evidence[]; alternatives:Candidate[]; reviewRequired:boolean; }
export interface StructuredAddress { name:string; primary:string; secondary:string; town:string; subdivision:string; postal:string; country:string; }
export interface AuditEntry { field:string; value:string; reason:string; }
export interface NameInterpretationAudit { field:'Name'|'Address1'; beforeAddress1?:string; afterAddress1?:string; action:'REMOVED_DUPLICATE'|'PROMOTED_CONTINUATION'|'RETAINED_AMBIGUOUS'|'MANUAL_NAME_EDIT'; nameText:string; sourceText:string; beforeName:string; afterName:string; reason:string; }
export interface NameInterpretation { originalName:string; candidate:Candidate; addressLines:string[]; audit:NameInterpretationAudit[]; reviewReasons:string[]; }
export interface Intelligence { nameInterpretation?:NameInterpretation; structured:StructuredAddress; town:Candidate; country:Candidate; postal:Candidate; subdivision:Candidate; sanitized:string[]; localityAudit:AuditEntry[]; notes:string[]; conflicts:string[]; }
export type CandidateKey = '1a'|'1b'|'2a'|'2z'|'2c'|'2b'|'2d'|'3a';
export interface HybridOutput { lines:string[]; candidates:Partial<Record<CandidateKey,string>>; dropped:AuditEntry[]; truncations:AuditEntry[]; }
export interface Validation { pmpg:'PASS'|'FAIL'|'NOT_APPLICABLE'; duplication:'PASS'|'FAIL'; length:'PASS'|'FAIL'; issues:string[]; evidenceConflict:boolean; }
export type Status = 'AUTO_TRANSLATED'|'PROPOSED_REVIEW_REQUIRED'|'NAME_ONLY'|'ERROR';
export interface ReviewEvent { at:string; action:'ACCEPT'|'APPROVE'|'EDIT'|'REJECT'; reviewer:string; reason:string; before:StructuredAddress; after:StructuredAddress; acceptedOutput?:{lines:string[];validation:Validation;status:Status;reasons:string[]}; }
export interface RecordResult { id:string; source:AddressInput; intelligence:Intelligence; hybrid:HybridOutput; validation:Validation; status:Status; reasons:string[]; reviewState:'PENDING'|'ACCEPTED'|'APPROVED'|'REJECTED'|'NONE'; reviews:ReviewEvent[]; version:number; }
export interface Batch { id:string; filename:string; createdAt:string; records:RecordResult[]; }
export interface Policy { countryThreshold:number; townThreshold:number; authorityOrder:Candidate['authority'][]; nameOnlyPolicy:'SLASH_33_66'; }
export const DEFAULT_POLICY:Policy = { countryThreshold:0.92, townThreshold:0.90, authorityOrder:['HUMAN_REVIEW','BANK_IDENTIFIER','ADDRESS_INFERENCE','UNRESOLVED'], nameOnlyPolicy:'SLASH_33_66' };

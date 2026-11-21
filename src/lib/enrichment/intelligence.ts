import { AddressAnalysisInput,Intelligence,DEFAULT_POLICY,Policy,Candidate } from '../domain';
import { ReferenceRepository,Place } from '../reference/types';
import { normalize,key,phrases,postalKey } from '../parser/normalize';
import { containsPhrase } from '../hybrid/validate';
import { isLocalityLine,sanitize,hasStreet } from '../parser/locality';
import { candidate,evidence } from './evidence';
import { chooseCountry } from './country';
import { findPostals } from './postal';
import { findSubdivision } from './subdivision';
import {interpretName} from '../parser/name';
import {splitLocalityTails} from '../parser/genericInternational';
export function enrich(input:AddressAnalysisInput,ref:ReferenceRepository,policy:Policy=DEFAULT_POLICY):Intelligence {
 const nameInterpretation=interpretName(input,{isKnownLocality:value=>{if(ref.countryMatches([key(value)]).some(match=>match.alias.length>2))return true;return ref.places(phrases(value)).some(place=>isLocalityLine(value,place.alias||place.name,ref.aliases(place.country),findPostals([value],place.country,ref)[0]||'',place.subdivision));}});
 const originalLines=nameInterpretation.addressLines;const text=originalLines.join(' ');const tokens=phrases(text);
 const available=ref.places(tokens);
 const segments=splitLocalityTails(originalLines,available,ref);const lines=segments.map(s=>s.text);
 const notes:string[]=[],conflicts:string[]=[];
 for(const [field,value] of Object.entries(input)){if(typeof value==='string'&&normalize(value)!==value)notes.push(`${field}: normalized Unicode NFKC, case and whitespace; original preserved`);}
 const countryHits=ref.countryMatches(tokens).filter(c=>(c.alias.length>2||c.alias==='UK')&&lines.some(l=>containsPhrase(l,c.alias)&&(!hasStreet(l)||key(l)===c.alias||key(l).endsWith(' '+c.alias))));
 const explicit=countryHits.filter(c=>!countryHits.some(other=>other.alias!==c.alias&&containsPhrase(other.alias,c.alias)));
 const explicitCodes=[...new Set(explicit.map(c=>c.country))];
 const bank=normalize(input.Bank_Country||'');const countries=ref.countries();
 const bankCode=countries.find(c=>c.code===bank||c.alpha3===bank||key(c.name)===key(bank))?.code;
 if(bank&&!bankCode)conflicts.push('Invalid Bank_Country supplied');
 if(explicitCodes.length>1)conflicts.push('Multiple explicit countries in address');
 // Only independent locality contexts support inference. Street-name matches are retained as content.
 const viable=available.filter(p=>lines.some(l=>isLocalityLine(l,p.alias||p.name,ref.aliases(p.country),findPostals([l],p.country,ref)[0]||'',p.subdivision)));
 const countryCandidates:Candidate[]=explicitCodes.map(code=>candidate(code,0.99,'EXPLICIT_COUNTRY_NAME',[evidence('Explicit Country Name',explicit.filter(x=>x.country===code).map(x=>x.alias).join(', '),0.99,'ADDRESS_TEXT') ]));
 if(bankCode)countryCandidates.push(candidate(bankCode,1,'BANK_COUNTRY',[evidence('Authoritative Bank Country',bankCode,1,'BANK_COUNTRY')],'BANK_IDENTIFIER'));
 if(bankCode&&explicitCodes.some(c=>c!==bankCode))conflicts.push('Bank country disagrees with explicit address country');
 if(!countryCandidates.length){
  const inferred=[...new Set(viable.map(p=>p.country))];
  for(const c of inferred){const ps=viable.filter(p=>p.country===c);const postals=findPostals(lines,c,ref);const exact=ps.some(p=>postals.some(z=>ref.postal(z,c).some(m=>m.id===p.id)));
   const subdiv=ps.some(p=>p.subdivision&&containsPhrase(text,p.subdivision));
   const score=exact?0.96:subdiv?0.88:0.75;
   countryCandidates.push(candidate(c,score,exact?'TOWN_POSTAL_REFERENCE':'TOWN_REFERENCE',[evidence(exact?'Town + Exact Postal Database Match':'Town Match',ps.map(p=>p.name).join(', '),score,'REFERENCE_DATABASE',exact?'Curated seed postal relation; not deliverability validation':'No authoritative country evidence')]));
  }
 }
 let country=countryCandidates.length?chooseCountry(countryCandidates,policy):candidate();
 country={...country,alternatives:countryCandidates.filter(c=>c!==country)};
 if(!explicitCodes.length&&!bankCode&&countryCandidates.length>1){country.confidence=Math.min(country.confidence,0.80);conflicts.push('Ambiguous country candidates');}
 const postalOptions=country.value?findPostals([...lines].reverse(),country.value,ref):[];
 // Prefer exact postal/place links or locality lines over street numbers.
 const rankedPostal=postalOptions.sort((a,b)=>Number(ref.postal(b,country.value).some(p=>viable.some(v=>v.id===p.id)))-Number(ref.postal(a,country.value).some(p=>viable.some(v=>v.id===p.id))));
 const postalValue=rankedPostal[0]||'';
 const postal=postalValue?candidate(postalValue,ref.postal(postalValue,country.value).length?0.98:0.85,ref.postal(postalValue,country.value).length?'EXACT_POSTAL_DATABASE_MATCH':'COUNTRY_POSTAL_PATTERN',[evidence('Country-Specific Postal Pattern',postalValue,0.85,'POSTAL_PATTERN', 'Pattern match is not postal existence validation')]):candidate();
 const eligible=viable.filter(p=>p.country===country.value);
 const distinct=[...new Map(eligible.map(p=>[p.id,p])).values()];
 const rank=(p:Place)=> (postalValue&&ref.postal(postalValue,p.country).some(m=>m.id===p.id)?10:0)+lines.reduce((v,l,i)=>containsPhrase(l,p.alias||p.name)?Math.max(v,i):v,0);
 distinct.sort((a,b)=>rank(b)-rank(a));
 const chosen=distinct[0];
 let town=candidate();
 if(chosen){const linked=postalValue&&ref.postal(postalValue,country.value).some(m=>key(m.name)===key(chosen.name)&&(!m.subdivision||!chosen.subdivision||m.subdivision===chosen.subdivision));
 if(postalValue&&ref.postal(postalValue,country.value).length&&!linked)conflicts.push('Known postal reference disagrees with selected town');
 const score=country.value==='HK'?0.86:linked?0.98:country.confidence>=0.92?0.94:0.82;
 town=candidate(chosen.name,score,'GAZETTEER_MATCH',[evidence('Town + Country Gazetteer Match',chosen.name,score,chosen.source,linked?'Corroborated by postal relationship':'No postal relationship corroboration')]);
 town.alternatives=distinct.slice(1).map(p=>candidate(p.name,0.7,'GAZETTEER_MATCH',[evidence('Alternative Town',p.name,0.7,p.source)]));
 if(distinct.length>1){conflicts.push('Multiple locality candidates require review');town.confidence=Math.min(town.confidence,0.85);}
 }else if(country.value){
 // Propose residual locality only from a country/postal line; never invent a gazetteer match.
 const aliases=ref.aliases(country.value);
 const line=[...lines].reverse().find(l=>!hasStreet(l)&&(postalValue&&l.includes(postalValue)||aliases.some(a=>containsPhrase(l,a))));
 if(line){const a:{field:string;value:string;reason:string}[]=[];const rest=sanitize([line],line,[],aliases,postalValue,'',a)[0];if(rest&&rest!==line)town=candidate(rest,0.5,'UNVERIFIED_LOCALITY',[evidence('Address Text Hint',rest,0.5,'ADDRESS_TEXT')]);}
 }
 const sub=country.value?findSubdivision(lines.filter(l=>containsPhrase(l,chosen?.alias||town.value)).join(' '),country.value,ref,chosen?.subdivision,chosen?.name):undefined;
 const subdivision=sub?candidate(sub.code,0.96,'EXPLICIT_SUBDIVISION_CODE',[evidence('Subdivision + Country Match',sub.code,0.96,'REFERENCE_DATABASE')]):candidate();
 subdivision.displayName=sub?.name;
 const localityAudit:Intelligence['localityAudit']=[];
 const aliases=country.value?ref.aliases(country.value):[];
 const townAliases=chosen?eligible.filter(p=>p.id===chosen.id).map(p=>p.alias||p.name):[];
 const logicalSanitized=sanitize(lines,town.value,townAliases,aliases,postalValue,subdivision.value,localityAudit,sub?[sub.name]:[]);
 for(const entry of localityAudit){const logicalIndex=Number(entry.field.replace('Address',''))-1;entry.field=`Address${segments[logicalIndex].sourceIndex+1}`;}
 const sanitized=originalLines.map((_,idx)=>logicalSanitized.filter((__,n)=>segments[n].sourceIndex===idx).filter(Boolean).join(' '));
 if(segments.length>3)notes.push('Recognized locality tails split from free-form source containers; originals preserved');
 const pieces=logicalSanitized.filter(Boolean).flatMap(l=>l.split(/[,;]\s*/).filter(Boolean));
 if(pieces.length>2)notes.push('Surviving lines beyond first merged into logical Secondary; source preserved');
 if(/\b(?:ATTN|C\/O|MAILSTOP)\b|[;!?]|\/{2}/i.test(text))notes.push('Attention, routing or unusual separators require review');
 if(country.value==='HK')notes.push('Hong Kong locality hierarchy requires review');
 if(available.some(p=>!viable.includes(p)&&containsPhrase(text,p.alias||p.name)))notes.push('Place word also appears in meaningful address content; retained');
 country.reviewRequired=country.confidence<policy.countryThreshold;town.reviewRequired=town.confidence<policy.townThreshold;
 return {nameInterpretation,structured:{name:nameInterpretation.candidate.value,primary:pieces[0]||'',secondary:pieces.slice(1).join(' '),town:town.value,country:country.value,postal:postalValue,subdivision:subdivision.value},town,country,postal,subdivision,sanitized,localityAudit,notes,conflicts};
}

import { HybridOutput, StructuredAddress } from '../domain';
import { slice, truncate } from './truncate';
import { shouldCombine } from './priorities';
export function generateCandidates(a:StructuredAddress,nameOnly=false):HybridOutput {
 const out:HybridOutput={lines:[],candidates:{},dropped:[],truncations:[]};
 const cut=(s:string,n:number,k:string)=>truncate(s,n,k,out.truncations);
 const segment=(s:string,k1:'1a'|'2a'|'2c',k2:'1b'|'2b'|'2d')=>{if(s)out.candidates[k1]=`${k1[0]}/${slice(s,0,33)}`;if(Array.from(s).length>33)out.candidates[k2]=`${k2[0]}/${slice(s,33,66)}`;};
 segment(cut(a.name,66,'Name'),'1a','1b');
 if(nameOnly){out.dropped.push(...out.truncations);return out;}
 let p=a.primary,s=a.secondary;
 // Decision uses raw logical-line lengths BEFORE source truncation and separator.
 if(shouldCombine(p,s)){p=`${p} ${s}`;s='';}
 segment(cut(p,66,'Primary'),'2a','2b'); segment(cut(s,66,'Secondary'),'2c','2d');
 const postal=cut(a.postal,33,'Postal');
 const sub=cut(a.subdivision,Math.max(0,33-Array.from(postal).length-(postal&&a.subdivision?1:0)),'Subdivision');
 const z=[postal,sub].filter(Boolean).join(' ');if(z)out.candidates['2z']=`2/${z}`;
 out.candidates['3a']=`3/${a.country||'ZZ'}/${cut(a.town||'NOTPROVIDED',30,'Town')}`;
 out.dropped.push(...out.truncations);
 return out;
}

import { db } from '../../db/connection';
import { ReferenceRepository,Country,Place,PostalMatch } from './types';
import { postalKey } from '../parser/normalize';
export class SqliteReferenceRepository implements ReferenceRepository {
 private cache=new Map<string,unknown>();
 invalidate(){this.cache.clear();}
 private memo<T>(key:string,fn:()=>T):T{if(this.cache.has(key))return this.cache.get(key) as T;const result=fn();if(this.cache.size>20000)this.cache.clear();this.cache.set(key,result);return result;}
 countries(){return this.memo('countries',()=>db().prepare('SELECT * FROM countries').all() as Country[]);}
 countryMatches(tokens:string[]){return this.lookup<{alias:string;country:string}>('SELECT * FROM country_aliases WHERE alias IN',tokens);}
 aliases(country:string){return this.memo(`alias:${country}`,()=> (db().prepare('SELECT alias FROM country_aliases WHERE country=?').all(country) as {alias:string}[]).map(x=>x.alias));}
 private lookup<T>(sql:string,tokens:string[],suffix='',args:string[]=[]):T[]{const out:T[]=[];for(let i=0;i<tokens.length;i+=400){const chunk=tokens.slice(i,i+400);if(chunk.length)out.push(...db().prepare(`${sql} (${chunk.map(()=>'?').join(',')}) ${suffix}`).all(...chunk,...args) as T[]);}return out;}
 places(tokens:string[],country?:string){return this.memo(`p:${country}:${tokens.join('|')}`,()=>this.lookup<Place>('SELECT p.*,a.alias FROM place_aliases a JOIN places p ON p.id=a.place_id WHERE a.alias IN',tokens,country?'AND p.country=?':'',country?[country]:[]));}
 postal(value:string,country?:string){return this.memo(`z:${country}:${value}`,()=>db().prepare(`SELECT p.*,z.postal FROM postal_codes z JOIN places p ON p.id=z.place_id WHERE z.postal=? ${country?'AND z.country=?':''}`).all(...[postalKey(value),...(country?[country]:[])]) as PostalMatch[]);}
 subdivisions(country:string){return this.memo(`s:${country}`,()=>db().prepare('SELECT s.code,s.name,a.alias FROM subdivisions s JOIN subdivision_aliases a ON a.country=s.country AND a.code=s.code WHERE s.country=?').all(country) as {code:string;name:string;alias:string}[]);}
 postalPattern(country:string){return (db().prepare('SELECT pattern FROM postal_patterns WHERE country=?').get(country) as {pattern:string}|undefined)?.pattern;}
}
export const reference=new SqliteReferenceRepository();

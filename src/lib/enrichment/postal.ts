import { ReferenceRepository } from '../reference/types';
import { normalize } from '../parser/normalize';
export function findPostals(lines:string[],country:string,ref:ReferenceRepository):string[]{
 const pattern=ref.postalPattern(country);if(!pattern)return [];
 const rx=new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`,'gu');
 return [...new Set(lines.flatMap(l=>normalize(l).match(rx)||[]))];
}

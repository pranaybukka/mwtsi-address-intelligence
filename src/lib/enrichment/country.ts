import { Candidate,Policy } from '../domain';
export function chooseCountry(candidates:Candidate[],policy:Policy):Candidate {
 return [...candidates].sort((a,b)=>policy.authorityOrder.indexOf(a.authority)-policy.authorityOrder.indexOf(b.authority)||b.confidence-a.confidence)[0];
}

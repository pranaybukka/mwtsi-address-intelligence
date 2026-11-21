import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import fr from 'i18n-iso-countries/langs/fr.json';
import de from 'i18n-iso-countries/langs/de.json';
import es from 'i18n-iso-countries/langs/es.json';
import pt from 'i18n-iso-countries/langs/pt.json';
import ja from 'i18n-iso-countries/langs/ja.json';
import zh from 'i18n-iso-countries/langs/zh.json';
import { db } from './connection';
import seed from './seed-data.json';
import {key,postalKey} from '../lib/parser/normalize';
export function ensureSeed(){const d=db();if((d.prepare("SELECT value FROM metadata WHERE key='seed-version'").get() as {value:string}|undefined)?.value==='3')return;
 d.transaction(()=>{
 for(const locale of [en,fr,de,es,pt,ja,zh])countries.registerLocale(locale);
 const ci=d.prepare('INSERT OR IGNORE INTO countries VALUES (?,?,?)'),ca=d.prepare('INSERT OR IGNORE INTO country_aliases VALUES (?,?)');
 for(const [code,name] of Object.entries(countries.getNames('en'))){if(code==='XK')continue;ci.run(code,countries.alpha2ToAlpha3(code)!,name);for(const lang of ['en','fr','de','es','pt','ja','zh']){const aliases=countries.getName(code,lang,{select:'all'});for(const alias of typeof aliases==='string'?[aliases]:aliases||[])ca.run(key(alias),code);}}
 for(const [alias,code] of Object.entries({USA:'US','UNITED STATES OF AMERICA':'US',UK:'GB','GREAT BRITAIN':'GB',UAE:'AE','VIET NAM':'VN','SOUTH KOREA':'KR','CZECH REPUBLIC':'CZ','HONG KONG':'HK',TAIWAN:'TW','TURKEY':'TR'}))ca.run(alias,code);
 const pi=d.prepare('INSERT OR IGNORE INTO places VALUES (?,?,?,?,?,?)'),pa=d.prepare('INSERT OR IGNORE INTO place_aliases VALUES (?,?)'),zi=d.prepare('INSERT OR IGNORE INTO postal_codes VALUES (?,?,?,?)');
 for(const [i,row] of seed.places.entries()){const [country,name,subdivision,postal,aliases]=row;const id=`seed:${i}`;pi.run(id,country,name,key(name),subdivision,'CURATED_DEMO_SEED');for(const alias of [name,...aliases.split('|').filter(Boolean)])pa.run(key(alias),id);for(const z of postal.split('|').filter(Boolean))zi.run(country,postalKey(z),id,subdivision);if(subdivision){d.prepare('INSERT OR IGNORE INTO subdivisions VALUES (?,?,?)').run(country,subdivision,subdivision);d.prepare('INSERT OR IGNORE INTO subdivision_aliases VALUES (?,?,?)').run(key(subdivision),country,subdivision);}}
 for(const [country,subdivisions] of Object.entries(seed.subdivisions)){for(const [code,name] of Object.entries(subdivisions)){d.prepare('INSERT OR REPLACE INTO subdivisions VALUES (?,?,?)').run(country,code,name);for(const alias of [code,name])d.prepare('INSERT OR IGNORE INTO subdivision_aliases VALUES (?,?,?)').run(key(alias),country,code);}}
 for(const [country,pattern] of Object.entries(seed.patterns))d.prepare('INSERT OR REPLACE INTO postal_patterns VALUES (?,?)').run(country,pattern);
 d.prepare("DELETE FROM countries WHERE code='XK'").run();d.prepare("DELETE FROM country_aliases WHERE country='XK'").run();
 d.prepare("INSERT OR REPLACE INTO metadata VALUES ('seed-version','3')").run();
 })();
}

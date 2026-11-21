import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
let singleton:Database.Database|undefined;
export function db(){if(!singleton){const file=process.env.ADDRESS_DB_PATH||path.join(process.cwd(),'data','address.db');if(file!==':memory:')fs.mkdirSync(path.dirname(file),{recursive:true});singleton=new Database(file);singleton.exec(fs.readFileSync(path.join(process.cwd(),'src/db/schema.sql'),'utf8'));}return singleton;}

import ExcelJS from 'exceljs';
import {loadWorkbook} from './load';
import {AddressInput} from '../domain';
import {MAIN_COLUMNS} from '../source';
import {preserveCell} from './preserve';
export const UPLOAD_LIMIT=20*1024*1024;
export const ROW_LIMIT=50000;
const expected=['Name','Address1','Address2','Address3'];
function text(cell:ExcelJS.Cell):string {const v=cell.value;if(v===null||v===undefined)return '';if(typeof v==='object'){if('formula'in v||'sharedFormula'in v)throw Error(`Formula cells are unsupported (${cell.address}); paste values first`);if('richText'in v)return v.richText.map(x=>x.text).join('');throw Error(`Unsupported cell type at ${cell.address}; use text values`);}if(typeof v==='boolean')throw Error(`Boolean cell ${cell.address} is not address text`);const s=String(v);if(s.length>10000)throw Error(`Cell ${cell.address} exceeds 10,000 characters`);return s;}
export async function importWorkbook(buffer:Buffer,filename:string):Promise<AddressInput[]>{
 if(!/\.xlsx$/i.test(filename))throw Error('Upload a .xlsx workbook; macros and legacy files are unsupported');
 if(buffer.length>UPLOAD_LIMIT)throw Error('Workbook exceeds 20 MB');
 if(buffer[0]!==0x50||buffer[1]!==0x4b)throw Error('Invalid Excel workbook signature');
 // Inspect ZIP central-directory advertised expansion before ExcelJS decompresses.
 let expanded=0,entries=0;for(let i=0;i<buffer.length-46;i++){if(buffer.readUInt32LE(i)===0x02014b50){entries++;expanded+=buffer.readUInt32LE(i+24);const n=buffer.readUInt16LE(i+28);const name=buffer.subarray(i+46,i+46+n).toString();if(/vbaProject|externalLinks\//i.test(name))throw Error('Macros and external links are unsupported');i+=45+n+buffer.readUInt16LE(i+30)+buffer.readUInt16LE(i+32);}}
 if(!entries||expanded>150*1024*1024||entries>10000)throw Error('Workbook archive expansion exceeds safe limits');
 const workbook=await loadWorkbook(buffer);
 const sheet=workbook.getWorksheet('Raw Test Data')||workbook.worksheets[0];if(!sheet)throw Error('Workbook has no worksheet');
 if(sheet.rowCount>ROW_LIMIT+1)throw Error(`Maximum ${ROW_LIMIT.toLocaleString()} rows per batch`);
 const headers=new Map<string,number>();const extraHeaders:{header:string;column:number}[]=[];const seen=new Set<string>();
 const canonical=new Map([...MAIN_COLUMNS,'Group'].map(header=>[header.toLowerCase(),header]));
 sheet.getRow(1).eachCell((cell,column)=>{const original=text(cell);const trimmed=original.trim();if(!trimmed)return;const signature=trimmed.toLowerCase();if(seen.has(signature))throw Error(`Duplicate column: ${trimmed}`);seen.add(signature);const main=canonical.get(signature);if(main)headers.set(main,column);else extraHeaders.push({header:original,column});});
 for(const name of expected)if(!headers.has(name))throw Error(`Missing required column: ${name}`);
 const knownColumns=new Set([...headers.values(),...extraHeaders.map(h=>h.column)]);
 const result:AddressInput[]=[];
 for(let i=2;i<=sheet.rowCount;i++){const row=sheet.getRow(i);const field=(name:string)=>headers.has(name)?text(row.getCell(headers.get(name)!)):'';
 row.eachCell((cell,column)=>{if(!knownColumns.has(column)&&cell.value!==null&&cell.value!==undefined)throw Error(`Column ${column} has data but no header; add a header before upload`);});
 const source:AddressInput={Name:field('Name'),Address1:field('Address1'),Address2:field('Address2'),Address3:field('Address3'),Bank_Country:field('Bank_Country'),Group:field('Group'),additionalColumns:extraHeaders.map(h=>({header:h.header,cell:preserveCell(row.getCell(h.column))}))};
 const hasMain=[...MAIN_COLUMNS,'Group'].some(k=>Boolean(source[k as keyof AddressInput]));
 const hasExtra=source.additionalColumns!.some(({cell})=>cell.value!==null&&cell.value!==''||cell.originalFormula);
 if(hasMain||hasExtra)result.push(source);
 }
 if(!result.length)throw Error('No address records found');return result;
}

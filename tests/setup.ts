import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
process.env.ADDRESS_DB_PATH=path.join(mkdtempSync(path.join(tmpdir(),'atlas-test-')),'test.db');

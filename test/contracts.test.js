import test from 'node:test';
import { createService } from '../src/service.js';
import { contracts } from '../checks/contracts.js';
for(const [name,check] of contracts)test(name,()=>check(createService));

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulateRequest} from '../src/services/playground.ts';
test('list can filter without changing the fixture',()=>{assert.equal((simulateRequest('list','KEYBOARD').data as {items:unknown[]}).items.length,1);assert.equal((simulateRequest('list','').data as {items:unknown[]}).items.length,3);});
test('lookup distinguishes missing resources from malformed identifiers',()=>{assert.equal(simulateRequest('one','1').status,200);assert.equal(simulateRequest('one','999').status,404);for(const id of ['-1','1.1','abc','0','9007199254740992'])assert.equal(simulateRequest('one',id).status,400);});
test('creation rejects malformed JSON and invalid values',()=>{for(const input of ['broken','null','[]','{}','{"name":" ","price":1}','{"name":"Desk","price":0}','{"name":"Desk","price":"24"}','{"name":"Desk","price":1e999}'])assert.equal(simulateRequest('create',input).status,400);});
test('creation trims names and does not persist',()=>{const result=simulateRequest('create','{"name":" Desk ","price":24}');assert.equal(result.status,201);assert.deepEqual(result.data,{id:'demo-only',name:'Desk',price:24,persisted:false});assert.equal((simulateRequest('list','').data as {items:unknown[]}).items.length,3);});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(process.env.SIGNUP_SERVICE_SOURCE || path.join(__dirname, 'signup-service.gs'), 'utf8');

function service(initialClaims = []) {
  let claims = structuredClone(initialClaims);
  const useCases = [{ id: 'UC-001', title: 'Existing use case', session: 3 }];
  const stages = [];
  let released = 0;
  class FutureDate extends Date {
    static now() { return Date.parse('2100-01-01T00:00:00Z'); }
  }
  const context = vm.createContext({
    Date: FutureDate,
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => released++ }) }
  });
  vm.runInContext(source, context);
  Object.assign(context, {
    readClaims_: () => structuredClone(claims),
    writeClaims_: next => { claims = structuredClone(next); },
    useCaseTable_: () => ({ values: [['UC ID'], ...useCases.map(u => [u.id])], col: () => 0 }),
    findUseCase_: (_table, id) => useCases.find(u => u.id === id),
    appendUseCase_: (_table, id, u) => useCases.push({ id, ...structuredClone(u) }),
    updateUseCase_: (_table, id, u) => Object.assign(useCases.find(x => x.id === id), u),
    setUseCaseCells_: (_table, id, cells) => stages.push({ id, ...cells }),
    mirror_: () => {}
  });
  return { call: body => JSON.parse(JSON.stringify(context.handle_(body))), claims: () => claims, useCases, stages, released: () => released };
}

const participant = { name: 'Test Participant', email: 'test@example.invalid', pid: 'test', sessions: [3] };
const ownCase = { title: 'Supplier risk summary', pain: 'Review supplier updates manually.', solution: 'AI summarizes supplier risks.', sessions: 'S3' };

test('participants can create and edit their own use cases after the old deadline', () => {
  const api = service();
  const created = api.call({ action: 'addOwn', claim: participant, useCase: ownCase });
  assert.equal(created.ok, true, created.error);
  assert.equal(created.ucId, 'UC-002');
  assert.equal(created.claims[0].own, true);
  assert.equal(created.claims[0].assignedBy, undefined);
  assert.equal(api.useCases[1].title, ownCase.title);
  const updated = api.call({ action: 'update', ucId: created.ucId, email: participant.email,
    fields: { ucTitle: 'Updated supplier summary', sessions: [3, 4] },
    useCase: { ...ownCase, title: 'Updated supplier summary', sessions: 'S3, S4' } });
  assert.equal(updated.ok, true, updated.error);
  assert.deepEqual(updated.claims[0].sessions, [3, 4]);
  assert.equal(api.useCases[1].title, 'Updated supplier summary');
  assert.equal(api.released(), 2);
});

test('participants can claim, switch and release after the old deadline', () => {
  for (const action of ['claim', 'switch']) {
    const api = service();
    const result = api.call({ action, claim: { ...participant, ucId: 'UC-001' } });
    assert.equal(result.ok, true, result.error);
    assert.equal(result.claims[0].ucId, 'UC-001');
    const released = api.call({ action: 'release', ucId: 'UC-001', email: participant.email });
    assert.equal(released.ok, true, released.error);
    assert.deepEqual(released.claims, []);
  }
});

test('validation and ownership restrictions still apply', () => {
  const api = service([{ ...participant, ucId: 'UC-001' }]);
  assert.equal(api.call({ action: 'addOwn', claim: {}, useCase: {} }).error, 'Missing participant details.');
  assert.equal(api.call({ action: 'addOwn', claim: participant, useCase: { title: 'x' } }).error, 'Add a short title for your use case.');
  assert.match(api.call({ action: 'claim', claim: { ...participant, email: 'other@example.invalid', ucId: 'UC-001' } }).error, /just taken/);
  assert.match(api.call({ action: 'update', ucId: 'UC-001', email: 'other@example.invalid', fields: { sessions: [4] } }).error, /not found/);
  const update = api.call({ action: 'update', ucId: 'UC-001', email: participant.email, fields: { assignedBy: 'Program team' } });
  assert.equal(update.ok, true);
  assert.equal(api.claims()[0].assignedBy, undefined);
  assert.equal(api.claims().length, 1);
});

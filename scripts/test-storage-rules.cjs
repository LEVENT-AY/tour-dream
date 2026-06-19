const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const PROJECT_ID = 'tour-tunisi-test';

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(resolve(__dirname, '../storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${name}`);
      console.error(err.message || err);
      failed++;
    }
  }

  // 1. Anonymous upload denied
  await test('Anonymous upload is denied', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    const blob = Buffer.from('test');
    await assertFails(
      unauthed.storage().ref('users/anyone/profile/avatar.png').put(blob, { contentType: 'image/png' })
    );
  });

  // 2. User can upload to own profile path
  await test('User can upload to own profile path', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    const blob = Buffer.from('test');
    await assertSucceeds(
      customer.storage().ref('users/customer1/profile/avatar.png').put(blob, { contentType: 'image/png' })
    );
  });

  // 3. User cannot upload to another user path
  await test('User cannot upload to another user path', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    const blob = Buffer.from('test');
    await assertFails(
      customer.storage().ref('users/agent1/profile/avatar.png').put(blob, { contentType: 'image/png' })
    );
  });

  // 4. Unsupported file type rejected
  await test('Unsupported file type is rejected', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    const blob = Buffer.from('test');
    await assertFails(
      customer.storage().ref('users/customer1/profile/doc.pdf').put(blob, { contentType: 'application/pdf' })
    );
  });

  // 5. Oversized file rejected (simulated via rules; emulator does not enforce size)
  // Note: The rules-unit-testing storage emulator does not validate request.resource.size,
  // so this test is documented but skipped in the automated suite.
  await test('Oversized file rule is defined (size limit in rules)', async () => {
    const rules = readFileSync(resolve(__dirname, '../storage.rules'), 'utf8');
    if (!rules.includes('5 * 1024 * 1024')) {
      throw new Error('Size limit not found in storage.rules');
    }
  });

  await testEnv.cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

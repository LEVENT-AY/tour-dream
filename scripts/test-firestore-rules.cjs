const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const PROJECT_ID = 'tour-tunisi-test';

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
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

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    // Seed test data
    await db.collection('users').doc('customer1').set({
      uid: 'customer1',
      email: 'customer1@example.com',
      displayName: 'Customer One',
      role: 'customer',
      createdAt: new Date().toISOString(),
    });
    await db.collection('users').doc('agent1').set({
      uid: 'agent1',
      email: 'agent1@example.com',
      displayName: 'Agent One',
      role: 'agent',
      agentStatus: 'approved',
      createdAt: new Date().toISOString(),
    });
    await db.collection('users').doc('admin1').set({
      uid: 'admin1',
      email: 'admin1@example.com',
      displayName: 'Admin One',
      role: 'admin',
      agentStatus: 'approved',
      createdAt: new Date().toISOString(),
    });
    await db.collection('bookings').doc('booking1').set({
      userId: 'customer1',
      agentId: 'agent1',
      itemTitle: 'Test Tour',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await db.collection('tours').doc('publishedTour').set({
      title: 'Published Tour',
      published: true,
      ownerId: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('tours').doc('draftTour').set({
      title: 'Draft Tour',
      published: false,
      ownerId: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('flights').doc('publishedFlight').set({
      title: 'Published Flight',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('flights').doc('draftFlight').set({
      title: 'Draft Flight',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('flights').doc('otherAgentFlight').set({
      title: 'Other Agent Flight',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cars').doc('publishedCar').set({
      title: 'Published Car',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cars').doc('draftCar').set({
      title: 'Draft Car',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cars').doc('otherAgentCar').set({
      title: 'Other Agent Car',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('activities').doc('publishedActivity').set({
      title: 'Published Activity',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('activities').doc('draftActivity').set({
      title: 'Draft Activity',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('activities').doc('otherAgentActivity').set({
      title: 'Other Agent Activity',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('chalets').doc('publishedChalet').set({
      title: 'Published Chalet',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('chalets').doc('draftChalet').set({
      title: 'Draft Chalet',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('chalets').doc('otherAgentChalet').set({
      title: 'Other Agent Chalet',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cruises').doc('publishedCruise').set({
      title: 'Published Cruise',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cruises').doc('draftCruise').set({
      title: 'Draft Cruise',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('cruises').doc('otherAgentCruise').set({
      title: 'Other Agent Cruise',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('buses').doc('publishedBus').set({
      title: 'Published Bus',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('buses').doc('draftBus').set({
      title: 'Draft Bus',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('buses').doc('otherAgentBus').set({
      title: 'Other Agent Bus',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('visas').doc('publishedVisa').set({
      title: 'Published Visa',
      published: true,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('visas').doc('draftVisa').set({
      title: 'Draft Visa',
      published: false,
      ownerId: 'agent1',
      agentId: 'agent1',
      createdBy: 'agent1',
      createdAt: new Date().toISOString(),
    });
    await db.collection('visas').doc('otherAgentVisa').set({
      title: 'Other Agent Visa',
      published: false,
      ownerId: 'agent2',
      agentId: 'agent2',
      createdBy: 'agent2',
      createdAt: new Date().toISOString(),
    });
    await db.collection('settings').doc('app').set({
      maintenanceMode: false,
    });
  });

  // 1. Anonymous user cannot read private user profiles
  await test('Anonymous user cannot read private user profiles', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(unauthed.firestore().collection('users').doc('customer1').get());
  });

  // 2. User can read their own profile
  await test('User can read their own profile', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('users').doc('customer1').get());
  });

  // 3. User cannot read another user's private profile
  await test('User cannot read another user private profile', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('users').doc('agent1').get());
  });

  // 4. User cannot change their own role
  await test('User cannot change their own role', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(
      customer.firestore().collection('users').doc('customer1').update({ role: 'admin' })
    );
  });

  // 5. Customer cannot access admin data (settings)
  await test('Customer cannot access admin data', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('settings').doc('app').get());
  });

  // 6. Customer cannot access another customer booking
  await test('Customer cannot access another customer booking', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('bookings').doc('booking2').set({
        userId: 'customer2',
        agentId: 'agent1',
        itemTitle: 'Other Booking',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    });
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('bookings').doc('booking2').get());
  });

  // 7. Agent cannot access another agent listings or bookings
  await test('Agent cannot access another agent listing or booking', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('tours').doc('agent2Tour').set({
        title: 'Agent Two Tour',
        published: true,
        ownerId: 'agent2',
        createdAt: new Date().toISOString(),
      });
      await context.firestore().collection('bookings').doc('booking3').set({
        userId: 'customer2',
        agentId: 'agent2',
        itemTitle: 'Agent Two Booking',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    });
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('tours').doc('agent2Tour').update({ title: 'Hacked' }));
    await assertFails(agent.firestore().collection('bookings').doc('booking3').get());
  });

  // 8. Public user can read published listing
  await test('Public user can read published listing', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('tours').doc('publishedTour').get());
  });

  // 9. Public user cannot read unpublished listing
  await test('Public user cannot read unpublished listing', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(unauthed.firestore().collection('tours').doc('draftTour').get());
  });

  // 10. Anonymous user can read published flight
  await test('Anonymous user can read published flight', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('flights').doc('publishedFlight').get());
  });

  // 11. Signed-in customer can read published flight
  await test('Signed-in customer can read published flight', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('flights').doc('publishedFlight').get());
  });

  // 12. Signed-in customer cannot read unpublished flight
  await test('Signed-in customer cannot read unpublished flight', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('flights').doc('draftFlight').get());
  });

  // 13. Non-owning agent cannot read another agent's unpublished flight
  await test("Non-owning agent cannot read another agent's unpublished flight", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('flights').doc('otherAgentFlight').get());
  });

  // 14. Owning approved agent can read their own unpublished flight
  await test('Owning approved agent can read own unpublished flight', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('flights').doc('draftFlight').get());
  });

  // 15. Admin can read all flights
  await test('Admin can read all flights', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('flights').doc('publishedFlight').get());
    await assertSucceeds(admin.firestore().collection('flights').doc('draftFlight').get());
    await assertSucceeds(admin.firestore().collection('flights').doc('otherAgentFlight').get());
  });

  // 16. Signed-in customer cannot read unpublished flight
  await test('Signed-in customer cannot read unpublished flight', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('flights').doc('draftFlight').get());
  });

  // 17. Anonymous user can read published car
  await test('Anonymous user can read published car', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('cars').doc('publishedCar').get());
  });

  // 18. Signed-in customer can read published car
  await test('Signed-in customer can read published car', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('cars').doc('publishedCar').get());
  });

  // 19. Signed-in customer cannot read unpublished car
  await test('Signed-in customer cannot read unpublished car', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('cars').doc('draftCar').get());
  });

  // 20. Non-owning agent cannot read another agent's unpublished car
  await test("Non-owning agent cannot read another agent's unpublished car", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('cars').doc('otherAgentCar').get());
  });

  // 21. Owning approved agent can read own unpublished car
  await test('Owning approved agent can read own unpublished car', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('cars').doc('draftCar').get());
  });

  // 22. Admin can read all cars
  await test('Admin can read all cars', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('cars').doc('publishedCar').get());
    await assertSucceeds(admin.firestore().collection('cars').doc('draftCar').get());
    await assertSucceeds(admin.firestore().collection('cars').doc('otherAgentCar').get());
  });

  // 23. Admin can read settings
  await test('Admin can read admin data', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('settings').doc('app').get());
  });

  // 24. Anonymous user can read published activity
  await test('Anonymous user can read published activity', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('activities').doc('publishedActivity').get());
  });

  // 25. Signed-in customer can read published activity
  await test('Signed-in customer can read published activity', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('activities').doc('publishedActivity').get());
  });

  // 26. Signed-in customer cannot read unpublished activity
  await test('Signed-in customer cannot read unpublished activity', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('activities').doc('draftActivity').get());
  });

  // 27. Non-owning agent cannot read another agent's unpublished activity
  await test("Non-owning agent cannot read another agent's unpublished activity", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('activities').doc('otherAgentActivity').get());
  });

  // 28. Owning approved agent can read own unpublished activity
  await test('Owning approved agent can read own unpublished activity', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('activities').doc('draftActivity').get());
  });

  // 29. Admin can read all activities
  await test('Admin can read all activities', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('activities').doc('publishedActivity').get());
    await assertSucceeds(admin.firestore().collection('activities').doc('draftActivity').get());
    await assertSucceeds(admin.firestore().collection('activities').doc('otherAgentActivity').get());
  });

  // 30. Anonymous user can read published chalet
  await test('Anonymous user can read published chalet', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('chalets').doc('publishedChalet').get());
  });

  // 31. Signed-in customer can read published chalet
  await test('Signed-in customer can read published chalet', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('chalets').doc('publishedChalet').get());
  });

  // 32. Signed-in customer cannot read unpublished chalet
  await test('Signed-in customer cannot read unpublished chalet', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('chalets').doc('draftChalet').get());
  });

  // 33. Non-owning agent cannot read another agent\'s unpublished chalet
  await test("Non-owning agent cannot read another agent's unpublished chalet", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('chalets').doc('otherAgentChalet').get());
  });

  // 34. Owning approved agent can read own unpublished chalet
  await test('Owning approved agent can read own unpublished chalet', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('chalets').doc('draftChalet').get());
  });

  // 35. Admin can read all chalets
  await test('Admin can read all chalets', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('chalets').doc('publishedChalet').get());
    await assertSucceeds(admin.firestore().collection('chalets').doc('draftChalet').get());
    await assertSucceeds(admin.firestore().collection('chalets').doc('otherAgentChalet').get());
  });

  // 36. Anonymous user can read published cruise
  await test('Anonymous user can read published cruise', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('cruises').doc('publishedCruise').get());
  });

  // 37. Signed-in customer can read published cruise
  await test('Signed-in customer can read published cruise', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('cruises').doc('publishedCruise').get());
  });

  // 38. Signed-in customer cannot read unpublished cruise
  await test('Signed-in customer cannot read unpublished cruise', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('cruises').doc('draftCruise').get());
  });

  // 39. Non-owning agent cannot read another agent's unpublished cruise
  await test("Non-owning agent cannot read another agent's unpublished cruise", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('cruises').doc('otherAgentCruise').get());
  });

  // 40. Owning approved agent can read own unpublished cruise
  await test('Owning approved agent can read own unpublished cruise', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('cruises').doc('draftCruise').get());
  });

  // 41. Admin can read all cruises
  await test('Admin can read all cruises', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('cruises').doc('publishedCruise').get());
    await assertSucceeds(admin.firestore().collection('cruises').doc('draftCruise').get());
    await assertSucceeds(admin.firestore().collection('cruises').doc('otherAgentCruise').get());
  });

  // 42. Admin can create, update, and delete a cruise
  await test('Admin can create, update, and delete a cruise', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    const ref = admin.firestore().collection('cruises').doc('adminCruise');
    await assertSucceeds(ref.set({
      title: 'Admin Cruise',
      published: false,
      ownerId: 'admin1',
      agentId: 'admin1',
      createdBy: 'admin1',
      createdAt: new Date().toISOString(),
    }));
    await assertSucceeds(ref.update({ title: 'Updated Admin Cruise', updatedAt: new Date().toISOString() }));
    await assertSucceeds(ref.delete());
  });

  // 43. Anonymous user can read published bus
  await test('Anonymous user can read published bus', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('buses').doc('publishedBus').get());
  });

  // 44. Signed-in customer can read published bus
  await test('Signed-in customer can read published bus', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('buses').doc('publishedBus').get());
  });

  // 45. Signed-in customer cannot read unpublished bus
  await test('Signed-in customer cannot read unpublished bus', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('buses').doc('draftBus').get());
  });

  // 46. Non-owning agent cannot read another agent's unpublished bus
  await test("Non-owning agent cannot read another agent's unpublished bus", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('buses').doc('otherAgentBus').get());
  });

  // 47. Owning approved agent can read own unpublished bus
  await test('Owning approved agent can read own unpublished bus', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('buses').doc('draftBus').get());
  });

  // 48. Admin can read all buses
  await test('Admin can read all buses', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('buses').doc('publishedBus').get());
    await assertSucceeds(admin.firestore().collection('buses').doc('draftBus').get());
    await assertSucceeds(admin.firestore().collection('buses').doc('otherAgentBus').get());
  });

  // 49. Admin can create, update, and delete a bus
  await test('Admin can create, update, and delete a bus', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    const ref = admin.firestore().collection('buses').doc('adminBus');
    await assertSucceeds(ref.set({
      title: 'Admin Bus',
      published: false,
      ownerId: 'admin1',
      agentId: 'admin1',
      createdBy: 'admin1',
      createdAt: new Date().toISOString(),
    }));
    await assertSucceeds(ref.update({ title: 'Updated Admin Bus', updatedAt: new Date().toISOString() }));
    await assertSucceeds(ref.delete());
  });

  // 50. Anonymous user can read published visa
  await test('Anonymous user can read published visa', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertSucceeds(unauthed.firestore().collection('visas').doc('publishedVisa').get());
  });

  // 51. Signed-in customer can read published visa
  await test('Signed-in customer can read published visa', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertSucceeds(customer.firestore().collection('visas').doc('publishedVisa').get());
  });

  // 52. Signed-in customer cannot read unpublished visa
  await test('Signed-in customer cannot read unpublished visa', async () => {
    const customer = testEnv.authenticatedContext('customer1');
    await assertFails(customer.firestore().collection('visas').doc('draftVisa').get());
  });

  // 53. Non-owning agent cannot read another agent's unpublished visa
  await test("Non-owning agent cannot read another agent's unpublished visa", async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertFails(agent.firestore().collection('visas').doc('otherAgentVisa').get());
  });

  // 54. Owning approved agent can read own unpublished visa
  await test('Owning approved agent can read own unpublished visa', async () => {
    const agent = testEnv.authenticatedContext('agent1');
    await assertSucceeds(agent.firestore().collection('visas').doc('draftVisa').get());
  });

  // 55. Admin can read all visas
  await test('Admin can read all visas', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    await assertSucceeds(admin.firestore().collection('visas').doc('publishedVisa').get());
    await assertSucceeds(admin.firestore().collection('visas').doc('draftVisa').get());
    await assertSucceeds(admin.firestore().collection('visas').doc('otherAgentVisa').get());
  });

  // 56. Admin can create, update, and delete a visa
  await test('Admin can create, update, and delete a visa', async () => {
    const admin = testEnv.authenticatedContext('admin1');
    const ref = admin.firestore().collection('visas').doc('adminVisa');
    await assertSucceeds(ref.set({
      title: 'Admin Visa',
      published: false,
      ownerId: 'admin1',
      agentId: 'admin1',
      createdBy: 'admin1',
      createdAt: new Date().toISOString(),
    }));
    await assertSucceeds(ref.update({ title: 'Updated Admin Visa', updatedAt: new Date().toISOString() }));
    await assertSucceeds(ref.delete());
  });

  await testEnv.cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();

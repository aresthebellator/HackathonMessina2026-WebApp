import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { deleteApp } from 'firebase-admin/app';
import { getAdminDatabase, getFirebaseAdminApp } from './firebaseAdmin.js';

let initializedApp;
let testDirectory;

after(async () => {
  if (initializedApp) await deleteApp(initializedApp);
  if (testDirectory) {
    rmSync(join(testDirectory, 'service-account.json'));
    rmdirSync(testDirectory);
  }
});

test('requires a readable service-account JSON file', () => {
  assert.throws(
    () => getFirebaseAdminApp(join(tmpdir(), 'firebase-admin-does-not-exist.json')),
    /Unable to read Firebase service-account JSON/
  );
});

test('initializes a named Admin app and Realtime Database from service-account JSON', () => {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  testDirectory = mkdtempSync(join(tmpdir(), 'firebase-admin-test-'));
  const serviceAccountPath = join(testDirectory, 'service-account.json');
  writeFileSync(
    serviceAccountPath,
    JSON.stringify({
      project_id: 'wikingo-auth',
      client_email: 'firebase-adminsdk@example.iam.gserviceaccount.com',
      private_key: privateKey.replace(/\n/g, '\\n'),
    })
  );

  initializedApp = getFirebaseAdminApp(serviceAccountPath);
  const database = getAdminDatabase();

  assert.equal(initializedApp.name, 'wikingo-admin');
  assert.equal(initializedApp.options.credential.projectId, 'wikingo-auth');
  assert.equal(database.app, initializedApp);
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const adminAppName = 'wikingo-admin';
const defaultServiceAccountPath = fileURLToPath(
  new URL('../wikingo-auth-firebase-adminsdk-fbsvc-831ab3aff6.json', import.meta.url)
);
const databaseURL =
  'https://wikingo-auth-default-rtdb.europe-west1.firebasedatabase.app';
let adminApp;

export function getFirebaseAdminApp(serviceAccountPath = defaultServiceAccountPath) {
  if (adminApp) return adminApp;

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read Firebase service-account JSON at "${serviceAccountPath}".`,
      { cause: error }
    );
  }

  if (
    typeof serviceAccount.project_id !== 'string' ||
    typeof serviceAccount.client_email !== 'string' ||
    typeof serviceAccount.private_key !== 'string'
  ) {
    throw new Error(
      `Firebase service-account JSON at "${serviceAccountPath}" must include project_id, client_email and private_key.`
    );
  }

  adminApp =
    getApps().find((app) => app.name === adminAppName) ??
    initializeApp(
      {
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
        databaseURL,
      },
      adminAppName
    );

  return adminApp;
}

export function getAdminDatabase() {
  return getDatabase(getFirebaseAdminApp());
}

/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const adminAppName = 'wikingo-admin';
const defaultServiceAccountPath = fileURLToPath(
  new URL('../wikingo-auth-firebase-adminsdk-fbsvc-831ab3aff6.json', import.meta.url)
);
const defaultDatabaseURL =
  'https://wikingo-auth-default-rtdb.europe-west1.firebasedatabase.app';
let adminApp;

export function getFirebaseAdminApp(
  serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultServiceAccountPath
) {
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
        databaseURL: process.env.FIREBASE_DATABASE_URL || defaultDatabaseURL,
      },
      adminAppName
    );

  return adminApp;
}

export function getAdminDatabase() {
  return getDatabase(getFirebaseAdminApp());
}

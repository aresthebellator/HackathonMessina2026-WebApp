# Firebase Admin (server only)

Keep the Firebase service-account JSON file at the project root with the name
`wikingo-auth-firebase-adminsdk-fbsvc-831ab3aff6.json`, or set
`FIREBASE_SERVICE_ACCOUNT_PATH` to another local path. It must be the private
service-account key downloaded from Firebase Console → Project settings →
Service accounts. The filename is ignored by Git; never commit the JSON or
expose it through Vite or browser code.

Set `FIREBASE_DATABASE_URL` when the server uses a different Firebase project.

Server-side modules can import `getAdminDatabase` from `./firebaseAdmin.js` and
call it to obtain the Admin SDK Realtime Database instance. Admin access bypasses
Realtime Database Security Rules, so only use this from trusted server code.

Firebase Admin does not enable Firebase Authentication or replace client sign-in.
Email/password, Google, and anonymous sign-in still require Firebase
Authentication to be set up and the relevant providers enabled in the Firebase
Console.

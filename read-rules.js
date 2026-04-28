require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');

const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({ credential: admin.credential.cert(parsed) });

async function checkRules() {
  const ruleset = await admin.securityRules().getFirestoreRuleset();
  console.log(JSON.stringify(ruleset, null, 2));
}
checkRules().catch(console.error);

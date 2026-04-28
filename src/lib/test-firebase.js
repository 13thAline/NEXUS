const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
console.log("Key length:", serviceAccount ? serviceAccount.length : "undefined");

try {
  const parsed = JSON.parse(serviceAccount);
  console.log("Parse success:", parsed.project_id);
} catch (e) {
  console.log("Parse error:", e.message);
  console.log("First 20 chars:", serviceAccount.substring(0, 20));
}

const fetch = require('node-fetch');

async function testApi() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/incident/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'FIRE',
        severity: 'HIGH',
        floor: 3,
        zone: 'Test Zone',
        source: 'MANUAL',
        rawPayload: 'Test payload'
      })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testApi();

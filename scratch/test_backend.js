const http = require('http');

const BASE_URL = 'http://localhost/Tripgalileo/backend/api.php';

async function testEndpoint(name, url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const fullUrl = new URL(url);
    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || 80,
      path: fullUrl.pathname + fullUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        let isJson = false;
        try {
          json = JSON.parse(data);
          isJson = true;
        } catch (e) {}

        const isSuccess = json ? (json.success !== false) : (res.statusCode === 200);

        resolve({
          name,
          status: res.statusCode,
          isJson,
          itemCount: Array.isArray(json) ? json.length : (json?.data ? (Array.isArray(json.data) ? json.data.length : typeof json.data) : 'N/A'),
          success: isSuccess && (res.statusCode === 200),
          dataSnippet: isJson ? JSON.stringify(json).substring(0, 120) : data.substring(0, 120)
        });
      });
    });

    req.on('error', (err) => {
      resolve({ name, status: 'ERROR', error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("=== TRIPGALILEO SYSTEM TESTING REPORT ===");
  
  const tests = [
    { name: 'GET Hotels', url: `${BASE_URL}?resource=hotels` },
    { name: 'GET Cars', url: `${BASE_URL}?resource=cars` },
    { name: 'GET Bikes', url: `${BASE_URL}?resource=bikes` },
    { name: 'GET Flights', url: `${BASE_URL}?resource=flights` },
    { name: 'GET Packages', url: `${BASE_URL}?resource=packages` },
    { name: 'GET Vendors', url: `${BASE_URL}?resource=vendors` },
    { name: 'GET Users', url: `${BASE_URL}?resource=users` },
    { name: 'GET Bookings', url: `${BASE_URL}?resource=bookings` },
    { name: 'GET Markups', url: `${BASE_URL}?resource=markups` },
    { name: 'GET AI Leads', url: `${BASE_URL}?resource=ai_leads` },
    { name: 'GET Coupons', url: `${BASE_URL}?resource=coupons` },
    { name: 'GET Add-ons', url: `${BASE_URL}?resource=add_ons` },
    { name: 'GET Payment Settings', url: `${BASE_URL}?resource=payment_settings` },
    
    // Actions (POST)
    { name: 'POST Login (Admin)', url: `${BASE_URL}?action=login`, method: 'POST', body: { username: 'admin', password: 'admin@2026' } },
    { name: 'POST Login (SuperAdmin)', url: `${BASE_URL}?action=login`, method: 'POST', body: { username: 'superadmin', password: 'superadmin' } },
    { name: 'POST Airport Search', url: `${BASE_URL}?action=airport_search`, method: 'POST', body: { query: 'Delhi' } },
    { name: 'POST Search Flights (Duffel/Mock)', url: `${BASE_URL}?action=search_flights`, method: 'POST', body: { from: 'DEL', to: 'GOI', date: '2026-09-01', passengers: [{ type: 'adult' }] } },
    { name: 'POST Calculate Package Price', url: `${BASE_URL}?action=calculate_price`, method: 'POST', body: { package_id: 'package-1', travelers: 2, hotel_tier: '4star' } }
  ];

  const results = [];
  for (const t of tests) {
    const res = await testEndpoint(t.name, t.url, t.method || 'GET', t.body || null);
    results.push(res);
    const symbol = res.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} [HTTP ${res.status}] ${t.name} -> Items/Data: ${res.itemCount}`);
    if (!res.success) {
      console.log(`   Response snippet: ${res.dataSnippet}`);
    }
  }

  console.log("\n=========================================");
  const passed = results.filter(r => r.success).length;
  console.log(`TOTAL RESULT: ${passed} / ${results.length} PASSED`);
  console.log("=========================================");
}

runTests();

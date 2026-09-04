async function test() {
  try {
    const res = await fetch('http://localhost/tripgalileo/backend/api.php?action=search_flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'DEL', to: 'GOI', date: '2026-07-07', base_price: 5000 })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text);
  } catch (err) {
    console.error(err);
  }
}
test();

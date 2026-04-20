async function test() {
  const loginRes = await fetch('https://nalyse-backend.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'walidde94@gmail.com', password: 'password123' })
  });
  if (!loginRes.ok) { console.log('Login failed', await loginRes.text()); return; }
  const { token } = await loginRes.json();
  
  const govRes = await fetch('https://nalyse-backend.onrender.com/api/organization/governance', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Governance status:', govRes.status);
  console.log(await govRes.text());
}
test();

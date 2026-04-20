async function test() {
  const ts = Date.now();
  const email = `testuser_${ts}@nalyser.com`;
  
  // Register
  const regRes = await fetch('https://nalyse-backend.onrender.com/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', firstName: 'T', lastName: 'User' })
  });
  
  if (!regRes.ok) { console.log('Reg failed', await regRes.text()); return; }
  const { token } = await regRes.json();
  
  const govRes = await fetch('https://nalyse-backend.onrender.com/api/organization/governance', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Governance status:', govRes.status);
  console.log(await govRes.text());
}
test();

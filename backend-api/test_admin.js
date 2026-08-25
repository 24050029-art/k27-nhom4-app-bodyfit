const fetch = require('node-fetch');

async function main() {
  const token = 'mock-token:login:danhlon:SecretPassword123';
  const url = 'http://localhost:3000/v1/admin/dashboard';
  console.log('Sending request to', url);
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Response Status:', res.status);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();

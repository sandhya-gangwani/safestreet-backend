// seed-users.js
// Quick script to seed test users into the SafeStreet backend.
// Run with: node seed-users.js

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/register';

const users = [
  { email: 'admin@safestreet.com', password: 'password123', role: 'ADMIN' },
  { email: 'citizen@safestreet.com', password: 'password123', role: 'CITIZEN' },
];

async function registerUser(user) {
  try {
    const response = await axios.post(API_URL, user);
    const { token } = response.data;
    console.log(`✅ Registered ${user.email} – JWT token: ${token}`);
    return token;
  } catch (err) {
    if (err.response) {
      console.error(`❌ Failed to register ${user.email}:`, err.response.data);
    } else {
      console.error(`❌ Error registering ${user.email}:`, err.message);
    }
    return null;
  }
}

(async () => {
  console.log('🔧 Seeding test users...');
  for (const u of users) {
    await registerUser(u);
  }
  console.log('✅ Seeding complete');
})();

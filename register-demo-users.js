/**
 * Register demo users only
 */

const https = require('https');

const API_BASE = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';

const demoUsers = [
  {
    email: 'sarah.aip@test.com',
    password: 'demo1234',
    first_name: 'Sarah',
    last_name: 'Johnson'
  },
  {
    email: 'mike.fodmap@test.com',
    password: 'demo1234',
    first_name: 'Mike',
    last_name: 'Chen'
  },
  {
    email: 'lisa.histamine@test.com',
    password: 'demo1234',
    first_name: 'Lisa',
    last_name: 'Rodriguez'
  },
  {
    email: 'john.paleo@test.com',
    password: 'demo1234',
    first_name: 'John',
    last_name: 'Smith'
  },
  {
    email: 'emma.multi@test.com',
    password: 'demo1234',
    first_name: 'Emma',
    last_name: 'Wilson'
  }
];

const makeRequest = (url, method, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

const registerUser = async (user) => {
  const response = await makeRequest(`${API_BASE}/api/v1/auth/register`, 'POST', {
    email: user.email,
    password: user.password,
    firstName: user.first_name,
    lastName: user.last_name,
    userType: 'patient'
  });
  
  return { status: response.status, data: response.data };
};

const registerDemoUsers = async () => {
  console.log('📝 Registering demo users...\n');
  
  for (const user of demoUsers) {
    try {
      console.log(`👤 Registering ${user.email}...`);
      const result = await registerUser(user);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ Successfully registered`);
      } else {
        console.log(`   ⚠️  Registration response:`, result.status, result.data);
      }
      
    } catch (error) {
      console.error(`   ❌ Error registering ${user.email}:`, error.message);
    }
  }
  
  console.log('\n🎉 Demo user registration completed!');
};

registerDemoUsers().catch(console.error);

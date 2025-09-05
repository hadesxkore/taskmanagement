const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';
let authToken = '';

async function testAPI() {
    try {
        // 1. Test Registration
        console.log('\n1. Testing User Registration...');
        const registerResponse = await axios.post(`${API_URL}/users/register`, {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Registration successful:', registerResponse.data);

        // 2. Test Login
        console.log('\n2. Testing User Login...');
        const loginResponse = await axios.post(`${API_URL}/users/login`, {
            email: 'test@example.com',
            password: 'password123'
        });
        authToken = loginResponse.data.token;
        console.log('Login successful:', loginResponse.data);

        // 3. Test Creating a Task
        console.log('\n3. Testing Task Creation...');
        const taskResponse = await axios.post(
            `${API_URL}/tasks`,
            {
                title: 'My First Task',
                description: 'This is a test task',
                priority: 'high',
                status: 'pending'
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        console.log('Task created:', taskResponse.data);

        // 4. Test Getting Tasks
        console.log('\n4. Testing Get Tasks...');
        const getTasksResponse = await axios.get(
            `${API_URL}/tasks`,
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );
        console.log('Tasks retrieved:', getTasksResponse.data);

    } catch (error) {
        console.error('Error:', {
            message: error.message,
            response: error.response ? {
                data: error.response.data,
                status: error.response.status
            } : 'No response',
            config: error.config ? {
                url: error.config.url,
                method: error.config.method,
                data: error.config.data
            } : 'No config'
        });
    }
}

testAPI();

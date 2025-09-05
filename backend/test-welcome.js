const axios = require('axios');

async function testWelcome() {
    try {
        const response = await axios.get('http://localhost:5000/');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', {
            message: error.message,
            response: error.response ? {
                data: error.response.data,
                status: error.response.status
            } : 'No response'
        });
    }
}

testWelcome();

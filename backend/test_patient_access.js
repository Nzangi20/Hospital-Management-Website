const API_URL = 'http://localhost:5000/api';

async function testPatientAccess() {
    try {
        console.log('1. Attempting Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'john.doe@email.com',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.error('Login Failed:', loginRes.status, loginData);
            return;
        }

        console.log('Login Success!');
        const token = loginData.token;
        console.log('Token received:', token ? 'Yes' : 'No');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('\n2. Fetching Appointments...');
        try {
            const apptRes = await fetch(`${API_URL}/appointments`, { headers });
            const apptData = await apptRes.json();
            console.log('Appointments fetched:', apptRes.status, apptData.count !== undefined ? `Count: ${apptData.count}` : apptData);
        } catch (e) {
            console.error('Appointments Fetch Failed:', e.message);
        }

        console.log('\n3. Fetching Billing...');
        try {
            const billRes = await fetch(`${API_URL}/billing`, { headers });
            const billData = await billRes.json();
            console.log('Bills fetched:', billRes.status, billData.count !== undefined ? `Count: ${billData.count}` : billData);
        } catch (e) {
            console.error('Billing Fetch Failed:', e.message);
        }

    } catch (error) {
        console.error('Script Error:', error.message);
    }
}

testPatientAccess();

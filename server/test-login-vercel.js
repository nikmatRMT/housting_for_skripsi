async function run() {
    const url = 'https://housting-for-skripsi.vercel.app/api/auth/login';
    const payload = {
        email: 'rahmat@gmail.com',
        password: '123456'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response:', result);
    } catch (err) {
        console.error('Error:', err);
    }
}

run();
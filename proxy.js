const { ProxyAgent } = require('undici');

const url = 'https://ipv4.icanhazip.com';
const proxyUrl = 'http://1Fo2iPohpw6q4MNv:KWdfxGrz7ZU8aRxw@geo.iproyal.com:12321';
const client = new ProxyAgent(proxyUrl);

const proxyTest = async () => {
    try {
        const response = await fetch(url, {
            dispatcher: client,
        });

        const data = await response.text();
        console.log('Proxy IP:', data.trim());
    } catch (error) {
        console.error('Proxy connection failed:', error);
    }
};

proxyTest();

const express = require('express');
const { ProxyAgent } = require('undici');
const searchService = require('./src/services/search');
const catalogService = require('./src/services/catalog');

const app = express();
const port = process.env.PORT || 12321;

// 🔒 IPRoyal Proxy Configuration
const proxyUrl = 'http://1Fo2iPohpw6q4MNv:KWdfxGrz7ZU8aRxw@geo.iproyal.com:12321';
let requestCount = 0;
let proxyAgent = new ProxyAgent(proxyUrl);

// 🔄 Rotate Proxy after 3 requests
const rotateProxy = () => {
    requestCount++;
    if (requestCount > 3) {
        console.log('Rotating Proxy...');
        proxyAgent = new ProxyAgent(proxyUrl);
        requestCount = 0;
    }
};

// 🔗 Middleware to attach proxy
app.use((req, res, next) => {
    rotateProxy();
    console.log('Incoming Request:', req.method, req.originalUrl);
    console.log('Using Proxy:', proxyUrl);
    req.proxyAgent = proxyAgent;
    next();
});

// ✅ Route to test if proxy is working (Check external IP)
app.get('/proxy-test', async (req, res) => {
    const url = 'https://ipv4.icanhazip.com';
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
            dispatcher: req.proxyAgent,
        });
        const data = await response.text();
        res.send({ ip: data.trim() });
    } catch (error) {
        console.error('Proxy Test Failed:', error);
        res.status(500).send({ error: 'Proxy connection failed' });
    }
});

// ✅ Test GSMArena Access
app.get('/test-gsmarena', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://www.gsmarena.com/', {
            dispatcher: req.proxyAgent,
        });

        const statusCode = response.status;
        const responseText = await response.text();

        console.log('GSMArena Response Status:', statusCode);

        if (statusCode === 403 || statusCode === 429 || responseText.includes('Access Denied')) {
            return res.send(`Blocked by GSMArena with status code: ${statusCode}`);
        }

        res.send(`Successfully accessed GSMArena with status code: ${statusCode}`);
    } catch (error) {
        console.error('Error accessing GSMArena:', error);
        res.status(500).send('Error testing GSMArena access');
    }
});

// 🔍 Search Route
app.get('/search', async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.status(400).send({ error: 'Search term is required' });
    }

    try {
        const devices = await searchService.search(searchTerm, req.proxyAgent);
        res.send(devices);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).send({ error: 'Error fetching search results' });
    }
});

// 📚 Catalog Route
app.get('/catalog', async (req, res) => {
    try {
        const brands = await catalogService.getBrands(req.proxyAgent);
        res.send(brands);
    } catch (error) {
        console.error('Catalog Fetch Error:', error);
        res.status(500).send({ error: 'Error fetching brands' });
    }
});

// 📱 Device Details Route
app.get('/device', async (req, res) => {
    const deviceId = req.query.id;
    if (!deviceId) {
        return res.status(400).send({ error: 'Device ID is required' });
    }

    try {
        const device = await catalogService.getDevice(deviceId, req.proxyAgent);
        res.send(device);
    } catch (error) {
        console.error('Device Fetch Error:', error);
        res.status(500).send({ error: 'Error fetching device specifications' });
    }
});

// 🚀 Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
const cheerio = require('cheerio');

const getDataFromUrl = async (url, proxyAgent) => {
    const fetch = (await import('node-fetch')).default;
    try {
        const response = await fetch(`https://www.gsmarena.com${url}`, { dispatcher: proxyAgent });
        if (!response.ok) {
            throw new Error(`Error fetching data from URL: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching data from URL:', error);
        throw error;
    }
};

const searchDevices = async (searchTerm, proxyAgent) => {
    try {
        const html = await getDataFromUrl(`/results.php3?sQuickSearch=yes&sName=${searchTerm}`, proxyAgent);
        const $ = cheerio.load(html);
        const devices = [];

        const deviceElements = $('.makers').find('li');
        deviceElements.each((i, el) => {
            const imgBlock = $(el).find('img');
            devices.push({
                id: $(el).find('a').attr('href').replace('.php', ''),
                name: $(el).find('span').html().split('<br>').join(' '),
                img: imgBlock.attr('src'),
                description: imgBlock.attr('title'),
            });
        });

        return devices;
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
};

module.exports = {
    search: searchDevices,
};

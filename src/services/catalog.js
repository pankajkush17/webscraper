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

const getBrands = async (proxyAgent) => {
    const html = await getDataFromUrl('/makers.php3', proxyAgent);
    const $ = cheerio.load(html);
    const brands = [];

    $('.st-text').find('td').each((i, el) => {
        const brand = $(el).find('a').text();
        brands.push(brand);
    });

    return brands;
};

const getDevices = ($, elements) => {
    const devices = [];
    elements.each((i, el) => {
        const imgBlock = $(el).find('img');
        devices.push({
            id: $(el).find('a').attr('href').replace('.php', ''),
            name: $(el).find('span').html().split('<br>').join(' '),
            img: imgBlock.attr('src'),
            description: imgBlock.attr('title'),
        });
    });
    return devices;
};

const getNextPage = ($) => {
    const nextPage = $('.nav-pages').find('a').last().attr('href');
    return nextPage && nextPage.includes('page') ? nextPage.replace('.php', '') : null;
};

const getBrandDevices = async (brandUrl, proxyAgent) => {
    let html = await getDataFromUrl(`/${brandUrl}`, proxyAgent);
    let $ = cheerio.load(html);
    let devices = getDevices($, $('.makers').find('li'));
    let json = [...devices];

    while (getNextPage($)) {
        html = await getDataFromUrl(`/${getNextPage($)}.php`, proxyAgent);
        $ = cheerio.load(html);
        devices = getDevices($, $('.makers').find('li'));
        json = [...json, ...devices];
    }

    return json;
};

const getDevice = async (device, proxyAgent) => {
    const html = await getDataFromUrl(`/${device}.php`, proxyAgent);
    const $ = cheerio.load(html);

    const displaySize = $('span[data-spec=displaysize-hl]').text();
    const displayRes = $('div[data-spec=displayres-hl]').text();
    const cameraPixels = $('.accent-camera').text();
    const videoPixels = $('div[data-spec=videopixels-hl]').text();
    const ramSize = $('.accent-expansion').text();
    const chipset = $('div[data-spec=chipset-hl]').text();
    const batterySize = $('.accent-battery').text();
    const batteryType = $('div[data-spec=battype-hl]').text();
    const internalMemory = $('span[data-spec="storage-hl"]').text();
    const colors = $('td[data-spec="colors"]').text().trim();
    const imageUrl = $('div.specs-photo-main img').attr('src');

    return {
        displaySize,
        displayRes,
        cameraPixels,
        videoPixels,
        ramSize,
        chipset,
        batterySize,
        batteryType,
        internalMemory,
        colors,
        imageUrl,
    };
};

module.exports = {
    getBrands,
    getBrandDevices,
    getDevice,
};
const catalog = require('./src/services/catalog');

const fetchBrands = async () => {
    try {
        const brands = await catalog.getBrands();
        console.log(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
    }
};

fetchBrands();
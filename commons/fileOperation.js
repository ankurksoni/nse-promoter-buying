const fs = require('fs');
const moment = require('moment');
const axios = require('axios');
const config = require('../config/config.json');
const SAT = 6, SUN = 0, MON = 1;

let date = moment();
let DAY, YEAR, MONTH;
const numDay = date.day();
date = date.subtract(isSunday() ? 2 : processDate(), 'day');
DAY = date.format('DD');
YEAR = date.year();
MONTH = date.format('MMM').toUpperCase();

const fileName = `${DAY}-${MONTH}-${YEAR}`;

const URL = `https://www.nseindia.com/api/reports?archives=%5B%7B%22name%22%3A%22Full%20Bhavcopy%20and%20Security%20Deliverable%20data%22%2C%22type%22%3A%22daily-reports%22%2C%22category%22%3A%22capital-market%22%2C%22section%22%3A%22equities%22%7D%5D&date=${fileName}&type=equities&mode=single`;

const newFileName = `sec_bhavdata_full_${fileName.split('-').join("")}.csv`

function isSunday() {
    return SUN === numDay;
}
function isMonday() {
    return MON === numDay
}

function processDate() {
    if (isSunday()) {
        return 2;
    } else if (isMonday()) {
        return 3;
    }
    return 1;
}

async function download() {
    const ifFilePresent = await new Promise((resolve, reject) => {
        fs.promises.access(newFileName, fs.constants.F_OK)
            .then(() => resolve(true))
            .catch(() => resolve(false));
    });
    if (ifFilePresent) {
        return newFileName;
    }
    console.log(`URL: `, URL);
    try {
        const cookie = config.cookie;
        const response = await axios.get(URL, {
            headers: {
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'Accept': '*/*',
                cookie,
                'Referer': 'https://www.nseindia.com/all-reports',
                'X-Requested-With': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"Linux"'
            }
        });
        if (!response.data) {
            throw new Error(`Error while trying to download csv: ${newFileName} | status: ${response.status}`);
        }
        await fs.promises.writeFile(newFileName, response.data);
        console.info(`Bhav Copy file downloaded: ${newFileName}`);
        return newFileName;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

module.exports = { newFileName, download };
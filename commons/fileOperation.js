const get = require("async-get-file");
const jszip = require("jszip");
const fs = require('fs');
const moment = require('moment');

const SAT = 6, SUN = 0, MON = 1;

let date = moment();
let DAY, YEAR, MONTH;
const numDay = date.day();
date = date.subtract(isSunday() ? 2 : processDate(), 'day');
DAY = date.format('DD');
YEAR = date.year();
MONTH = date.format('MMM').toUpperCase();

const fileName = `cm${DAY}${MONTH}${YEAR}bhav.csv.zip`;

const URL = `https://archives.nseindia.com/content/historical/EQUITIES/${YEAR}/${MONTH}/${fileName}`;

function isSunday() {
    return SUN === numDay;
}

function isSaturday() {
    return SAT === numDay;
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
    console.log(`URL: `, URL);
    try {
        await get(URL, {});
        const fileContent = fs.readFileSync(fileName);
        const jszipInstance = new jszip();
        const result = await jszipInstance.loadAsync(fileContent);
        const keys = Object.keys(result.files);
        for (let key of keys) {
            const item = result.files[key];
            if (!item.dir) {
                fs.writeFileSync(item.name, Buffer.from(await item.async('arraybuffer')));
            }
        }
        console.log(`Bhav Copy file downloaded: ${fileName}`);
        return fileName;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { fileName, download };
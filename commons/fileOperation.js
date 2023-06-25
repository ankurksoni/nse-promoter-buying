const get = require("async-get-file");
const jszip = require("jszip");
const fs = require('fs');
const moment = require('moment');

const SUN = 0, SAT = 6;

const date = moment();
let DAY, YEAR, MONTH;
const numDay = date.day();
date.subtract((SUN === numDay) ? 2 : (SAT === numDay ? 1 : 0), 'day');
DAY = date.format('DD');
YEAR = date.year();
MONTH = date.format('MMM').toUpperCase();

const fileName = `cm${DAY}${MONTH}${YEAR}bhav.csv.zip`;

const URL = `https://archives.nseindia.com/content/historical/EQUITIES/${YEAR}/${MONTH}/${fileName}`;

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
const get = require("async-get-file");
const jszip = require("jszip");
const fs = require('fs');
const date = new Date();
const DAY = date.getDate();
const YEAR = date.getFullYear();
const MONTH = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
const fileName = `cm${DAY > 2 ? DAY - 1 : DAY}${MONTH}${YEAR}bhav.csv.zip`;

const URL = `https://archives.nseindia.com/content/historical/EQUITIES/${YEAR}/${MONTH}/${fileName}`;

async function download() {
    console.log(URL);
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
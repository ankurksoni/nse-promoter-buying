const fs = require('fs');
const promises = require('fs/promises');
const moment = require('moment');
const papa = require('papaparse');
const { exec } = require("child_process");
const { fileName } = require('./fileOperation');
let axios;
const duration = process.argv[2] || '1M';

console.log(`Duration: ${duration}`);

function getURL() {
    let date;
    switch (duration) {
        case '1D':
            date = getDDMMYYYY(1);
            break;
        case '1W':
            date = getDDMMYYYY(7);
            break;
        case '1M':
            date = moment().subtract(1, "months").format('DD-MM-YYYY');
            break;
        case '3M':
            date = moment().subtract(3, "months").format('DD-MM-YYYY');
            break;
        case '6M':
            date = moment().subtract(6, "months").format('DD-MM-YYYY');
            break;
        default:
            date = moment().subtract(3, "months").format('DD-MM-YYYY');
            break;
    }
    const URL = `https://www.nseindia.com/api/corporates-pit?index=equities&from_date=${date}&to_date=${getDDMMYYYY(0)}`;
    console.log(`FROM: ${date}, TO: ${getDDMMYYYY(0)}, URL: ${URL}`);
    return URL;
}

function getDDMMYYYY(day) {
    return moment().subtract(day, "days").format('DD-MM-YYYY');
}

async function readCSV() {
    const csvFile = fs.readFileSync(fileName.replace('.zip', ''));
    const csvData = csvFile.toString();
    return new Promise(resolve => {
        papa.parse(csvData, {
            header: true,
            complete: results => {
                resolve(results.data);
            }
        });
    });
};

async function fileExists(path) {
    return !!(await promises.stat(path).catch(e => false));
}

async function removeCSVFiles() {
    return new Promise((resolve, reject) => {
        exec(`rm -rf *csv*`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                reject(stderr);
                return;
            } else {
                console.log(`Removed all CSV files!`);
                resolve(1);
            }
        });
    });
}

async function validateIfFileExists(fileName) {
    const isFileExists = await fileExists(fileName);
    if (!isFileExists) {
        console.log('The file bhavcopy.csv does not exist.');
        process.exit(1);
    }
}

async function populateData() {
    let data;
    try {
        const url = getURL();
        axios = require('axios');
        const response = await axios.get(url, { withCredentials: true });
        console.log(`response.data: `, response.data);
        data = response.data.data;
    } catch (error) {
        console.error(`Exception while triggering API: ${JSON.stringify(error)}`);
    }
    if (!data) {
        let errorStatement = 'No data fetched from API request.';
        console.error(errorStatement);
        throw new Error(errorStatement);
    }
    return data;
}

async function sleep() {
    await new Promise((resolve, reject) => {
        setTimeout(() => { console.log(`--------`); resolve(1); }, 1000);
    });
}

module.exports = {
    getURL,
    getDDMMYYYY,
    readCSV,
    fileExists,
    removeCSVFiles,
    validateIfFileExists,
    populateData,
    sleep
}
const fs = require('fs');
const promises = require('fs/promises');
const moment = require('moment');
const papa = require('papaparse');
const { exec } = require("child_process");
const execFile = require('child_process').execFile;
const { fileName } = require('./fileOperation');
let axios;
const duration = process.argv[2] || '1M';
const config = require('../config/config.json');

const rateCopy = {}; // bhav copy

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
        execFile('/usr/bin/rm', ['-rf', '*csv*'], (error, output) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error);
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
        const cookie = config.cookie;
        axios = require('axios');
        const response = await axios({
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers: {
                'authority': 'www.nseindia.com',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,mr;q=0.8,hi;q=0.7',
                cookie,
                'referer': 'https://www.nseindia.com/companies-listing/corporate-filings-insider-trading',
                'sec-ch-ua': '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Linux"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
            }
        });
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

function customSort(a, b) {
    return b.VAL - a.VAL
};

function getSecondCopy(firstCopyData) {
    const secondCopyData = [];
    for (let element of firstCopyData) {
        const { symbol, secAcq, secVal, acqfromDt, acqtoDt } = element;
        let tempObj;
        if ('Market Sale' === element.acqMode) {
            const negativeSecAcq = secAcq * -1;
            const negativeSecVal = secVal * -1;
            tempObj = { symbol, secAcq: negativeSecAcq, secVal: negativeSecVal, acqfromDt, acqtoDt };
        } else {
            tempObj = { symbol, secAcq, secVal, acqfromDt, acqtoDt };
        }
        secondCopyData.push(tempObj);
    }
    return secondCopyData;
}

function getThirdCopy(secondCopyData) {
    const thirdCopyData = {};
    for (let obj of secondCopyData) {
        if (!thirdCopyData[obj.symbol]) {
            thirdCopyData[obj.symbol] = [];
        }
        thirdCopyData[obj.symbol].push({ acq: obj.secAcq, val: obj.secVal, acquisitionFromDate: obj.acqfromDt, acquisitionToDate: obj.acqtoDt });
    }
    return thirdCopyData;
}

function getFourthCopy(thirdCopyData) {
    const fourthCopyData = [];
    const keys = Object.keys(thirdCopyData);
    for (let SYMBOL of keys) {
        const arr = thirdCopyData[SYMBOL];
        const VAL_SUM = arr.filter((obj) => (obj.val < 0)).map((obj) => obj.val).join(', ');
        const ACQ = arr.reduce((acc, obj) => acc + parseInt(obj.acq), 0);
        const VAL = arr.reduce((acc, obj) => acc + parseInt(obj.val), 0);
        const PROMOTER_BUYING_PRICE = Math.floor(VAL / ACQ);
        const CURRENT_PRICE = rateCopy[SYMBOL];
        if (!CURRENT_PRICE) continue;
        const DIFF = (((CURRENT_PRICE - PROMOTER_BUYING_PRICE) / PROMOTER_BUYING_PRICE) * 100).toFixed(2) + '%'
        const WORTH = (CURRENT_PRICE < PROMOTER_BUYING_PRICE) ? 'STRONG BUY' : 'BUY';
        fourthCopyData.push({ SYMBOL, PROMOTER_BUYING_PRICE, CURRENT_PRICE, DIFF, WORTH, ACQ, VAL, VAL_SUM });
    }
    console.log(`fourthCopyData: `, fourthCopyData);
    return fourthCopyData.filter((obj) => obj.VAL > 1000000);
}

module.exports = {
    rateCopy,
    getURL,
    getDDMMYYYY,
    readCSV,
    fileExists,
    removeCSVFiles,
    validateIfFileExists,
    populateData,
    sleep,
    customSort,
    getSecondCopy,
    getThirdCopy,
    getFourthCopy
}
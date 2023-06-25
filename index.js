const { download } = require('./commons/fileOperation');
const { readCSV, removeCSVFiles, populateData, validateIfFileExists, sleep } = require('./commons/utility.js');
const personCategory = ['Promoter', 'Promoter Group'];
const MODE_OF_ACQUISITION = ['Market Purchase', 'Market Sale'];
const rateCopy = {}; // bhav copy

async function execute() {
    await removeCSVFiles();
    await sleep();
    const fileName = await download();
    await sleep();
    await validateIfFileExists(fileName);

    const CSVData = await readCSV();
    for (let obj of CSVData) {
        if ('EQ' === obj.SERIES) rateCopy[obj.SYMBOL] = Math.floor(parseFloat(obj.CLOSE));
    };

    const data = await populateData();

    delete data.acqNameList;
    // filter only market purchase AND Promoter group AND Promoter
    const firstCopyData = data.filter((obj) => personCategory.includes(obj.personCategory) && MODE_OF_ACQUISITION.includes(obj.acqMode));
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

    const thirdCopyData = {};
    for (let obj of secondCopyData) {
        if (!thirdCopyData[obj.symbol]) {
            thirdCopyData[obj.symbol] = [];
        }
        thirdCopyData[obj.symbol].push({ acq: obj.secAcq, val: obj.secVal, acquisitionFromDate: obj.acqfromDt, acquisitionToDate: obj.acqtoDt });
    }

    const fourthCopyData = [];
    const keys = Object.keys(thirdCopyData);
    for (let SYMBOL of keys) {
        const arr = thirdCopyData[SYMBOL];
        const VAL_SUM = arr.filter((obj) => (obj.val < 0)).map((obj) => obj.val).join(', ');
        const ACQ = arr.reduce((acc, obj) => acc + parseInt(obj.acq), 0);
        const VAL = arr.reduce((acc, obj) => acc + parseInt(obj.val), 0);
        const PROMOTER_BUYING_PRICE = Math.floor(VAL / ACQ);
        const CURRENT_PRICE = rateCopy[SYMBOL];
        const DIFF = (((CURRENT_PRICE - PROMOTER_BUYING_PRICE) / PROMOTER_BUYING_PRICE) * 100).toFixed(2) + '%'
        const WORTH = (CURRENT_PRICE < PROMOTER_BUYING_PRICE) ? 'STRONG BUY' : 'BUY';
        const TARGET1 = PROMOTER_BUYING_PRICE + Math.floor(PROMOTER_BUYING_PRICE * 0.6);
        if (CURRENT_PRICE < TARGET1) {
            if (VAL_SUM.length === 0) {
                fourthCopyData.push({ SYMBOL, PROMOTER_BUYING_PRICE, CURRENT_PRICE, DIFF, WORTH, ACQ, VAL, VAL_SUM });
            }
        }
    }

    const fifthCopyData = fourthCopyData.filter((obj) => obj.VAL > 1000000);
    const WORTH_SYMBOLS = fifthCopyData.map(obj => obj.SYMBOL).sort();
    for (let SYMBOL of WORTH_SYMBOLS) {
        const arr = thirdCopyData[SYMBOL];
        const tempArr = [];
        arr.forEach((obj) => {
            const bought = Math.floor(obj.val / obj.acq);
            tempArr.push({ ...obj, bought });
        });
        console.log('--------------------------------------');
        console.log(`SYMBOL => ${SYMBOL}, CMP => ${rateCopy[SYMBOL]}`);
        console.table(tempArr);
    };

    const sixthCopyData = fifthCopyData.sort((a, b) => b.VAL - a.VAL);
    console.table(sixthCopyData);
}

execute();

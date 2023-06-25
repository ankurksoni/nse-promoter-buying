const { download } = require('./commons/fileOperation');
const { readCSV, removeCSVFiles, populateData, validateIfFileExists,
    sleep, customSort, getSecondCopy, getThirdCopy,
    getFourthCopy, rateCopy } = require('./commons/utility.js');

const personCategory = ['Promoter', 'Promoter Group'];
const MODE_OF_ACQUISITION = ['Market Purchase', 'Market Sale'];

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
    const firstCopyData = data.filter((obj) => personCategory.includes(obj.personCategory) && MODE_OF_ACQUISITION.includes(obj.acqMode));;
    const secondCopyData = getSecondCopy(firstCopyData);
    const thirdCopyData = getThirdCopy(secondCopyData)
    const fifthCopyData = getFourthCopy(thirdCopyData);

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

    const sixthCopyData = fifthCopyData.sort(customSort);
    console.table(sixthCopyData);
}

execute();

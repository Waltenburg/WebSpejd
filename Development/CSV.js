const fs = require('fs');

function saveArraysToCsv(arrays, fileName, path) {
    const csv = arrays.map(row => row.join(',')).join('\n');
    fs.writeFile(`${path}/${fileName}.csv`, csv, (err) => {
    if (err)
        throw err;
    console.log('CSV file saved successfully.');
});
}

function loadCSV(fileName, path){
    var data = fs.readFileSync(`${path}/${fileName}.csv`).toString().split("\n").map(e => e.split(","));
    return data
}
const arrays = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
];

const fileName = 'myMatrix';
const fileName2 = 'myMatrix2';
const path = './output';

loadCSV(fileName, path);
saveArraysToCsv(arrays, fileName2, path);
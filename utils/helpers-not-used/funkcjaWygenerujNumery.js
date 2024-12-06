const fs = require('fs');

function zapiszNumeryDoPliku() {
    const numery = [];
    for (let i = 0; i <= 1500000; i++) {
        numery.push(i.toString().padStart(8, '0'));
    }
    fs.writeFile('numeryKsiagWieczystych.json', JSON.stringify(numery, null, 2), (err) => {
        if (err) console.error('Błąd przy zapisie', err);   
    });
}

zapiszNumeryDoPliku();

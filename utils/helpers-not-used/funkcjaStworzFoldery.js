const fs = require('fs');
const path = require('path');

function stworzFoldery(sciezkaPlikuJSON, sciezkaTworzeniaFolderow) {
    let kodyWydzialoweSadow;
    try {
        const jsonData = fs.readFileSync(sciezkaPlikuJSON, 'utf8');
        kodyWydzialoweSadow = JSON.parse(jsonData);
    } catch (error) {
        console.error("Błąd odczytu pliku...", error);
        return;
    }

   
    kodyWydzialoweSadow.forEach((kod) => {
        const courtFolderPath = path.join(sciezkaTworzeniaFolderow, kod);

        try {
            fs.mkdirSync(courtFolderPath, { recursive: true });

            for (let i = 0; i <= 9; i++) {
                const digitFolderPath = path.join(courtFolderPath, i.toString());
                fs.mkdirSync(digitFolderPath, { recursive: true });

                for (let j = 0; j <= 9; j++) {
                    const subDigitFolderPath = path.join(digitFolderPath, j.toString());
                    fs.mkdirSync(subDigitFolderPath, { recursive: true });
                }
            }
        } catch (error) {
            console.error(`Błąd ${kod}:`, error);
        }
    });
}


const sciezkaPlikuJSON = '../kodyWydzialoweSadow.json'; 
const sciezkaTworzeniaFolderow = path.join(__dirname);

stworzFoldery(sciezkaPlikuJSON, sciezkaTworzeniaFolderow);

const fs = require('fs');
const path = require('path');

const znakWartosc = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, 'X': 10, 'A': 11,
    'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17,
    'H': 18, 'I': 19, 'J': 20, 'K': 21, 'L': 22, 'M': 23,
    'N': 24, 'O': 25, 'P': 26, 'R': 27, 'S': 28, 'T': 29,
    'U': 30, 'W': 31, 'Y': 32, 'Z': 33
};

const znakNumer = {
    1: 1, 2: 3, 3: 7, 4: 1, 5: 3, 6: 7,
    7: 1, 8: 3, 9: 7, 10: 1, 11: 3, 12: 7
};

function obliczCyfreKontrolna(kodWydzialuSadu, numerKsiegiWieczystej) {
    const pelnyNumer = kodWydzialuSadu + numerKsiegiWieczystej;
    let suma = 0;

    for (let i = 0; i < pelnyNumer.length; i++) {
        const znak = pelnyNumer[i];
        const wartosc = znakWartosc[znak] || 0;
        const mnoznik = znakNumer[i + 1] || 1;
        suma += wartosc * mnoznik;
    }

    return suma % 10;
}

function generujStruktureDanych(sciezkaPlikuJSONWydzialy, sciezkaPlikuJSONKsiegi, sciezkaTworzeniaFolderow) {
    let kodyWydzialoweSadow, numeryKsiagWieczystych;

    try {
        const daneWydzialy = fs.readFileSync(sciezkaPlikuJSONWydzialy, 'utf8');
        kodyWydzialoweSadow = JSON.parse(daneWydzialy);

        const daneKsiegi = fs.readFileSync(sciezkaPlikuJSONKsiegi, 'utf8');
        numeryKsiagWieczystych = JSON.parse(daneKsiegi);
    } catch (error) {
        console.error("Błąd odczytu plików JSON:", error);
        return;
    }

    kodyWydzialoweSadow.forEach((kod) => {
        const wyniki = numeryKsiagWieczystych.map((numer) => {
            return {
                kodWydzialuSadu: kod,
                numerKsiegiWieczystej: numer,
                cyfraKontrolna: obliczCyfreKontrolna(kod, numer)
            };
        });

        const folderPath = path.join(sciezkaTworzeniaFolderow, kod);
        const outputFilePath = path.join(folderPath, 'wszystkieKsiegi.json');

        try {
            fs.writeFileSync(outputFilePath, JSON.stringify(wyniki, null, 2), 'utf8');
            console.log(`Zapisano plik: ${outputFilePath}`);
        } catch (error) {
            console.error(`Błąd zapisu pliku dla wydziału ${kod}:`, error);
        }
    });
}

// Przykładowe użycie
const sciezkaPlikuJSONWydzialy = path.join(__dirname, 'kodyWydzialoweSadow.json');
const sciezkaPlikuJSONKsiegi = path.join(__dirname, 'numeryKsiagWieczystych.json');
const sciezkaTworzeniaFolderow = path.join(__dirname, 'potencjalneNumeryKsiag');

generujStruktureDanych(sciezkaPlikuJSONWydzialy, sciezkaPlikuJSONKsiegi, sciezkaTworzeniaFolderow);

const fs = require('fs');

function generujPotencjalneNumeryKsiag(kodWydzialu, ostatniNumerKsiegi, cyfraKontrolna, maksymalnyZakres) {
    const znakWartosc = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
        '6': 6, '7': 7, '8': 8, '9': 9, 'X': 10, 'A': 11,
        'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17,
        'H': 18, 'I': 19, 'J': 20, 'K': 21, 'L': 22, 'M': 23,
        'N': 24, 'O': 25, 'P': 26, 'R': 27, 'S': 28, 'T': 29,
        'U': 30, 'W': 31, 'Y': 32, 'Z': 33
    };

    const znakMnoznik = {
        1: 1, 2: 3, 3: 7, 4: 1, 5: 3, 6: 7,
        7: 1, 8: 3, 9: 7, 10: 1, 11: 3, 12: 7
    };

    function obliczCyfreKontrolna(numer) {
        let suma = 0;
        for (let i = 0; i < numer.length; i++) {
            const znak = numer[i];
            const wartosc = znakWartosc[znak];
            const mnoznik = znakMnoznik[i + 1];
            suma += wartosc * mnoznik;
        }
        return suma % 10;
    }

    const tabelaPotencjalnychNumerow = [];
    for (let i = 0; i <= maksymalnyZakres; i++) {
        const numerString = i.toString().padStart(8, '0');

        if (numerString[numerString.length - 1] !== ostatniNumerKsiegi.toString()) {
            continue;
        }

        const numer = kodWydzialu + numerString;
        const calculatedControlDigit = obliczCyfreKontrolna(numer);

        if (calculatedControlDigit === cyfraKontrolna) {
            tabelaPotencjalnychNumerow.push({
                kodWydzialuSadu: kodWydzialu,
                numerKsiegiWieczystej: numerString,
                cyfraKontrolna: cyfraKontrolna
            });
        }
    }

    return tabelaPotencjalnychNumerow;
}

function zapiszPlik(tabelaPotencjalnychNumerow, nazwaPliku) {
    fs.writeFileSync(nazwaPliku, JSON.stringify(tabelaPotencjalnychNumerow, null, 2), 'utf-8');
}

const wyniki = generujPotencjalneNumeryKsiag("WR1K", 2, 1, 1500000);
zapiszPlik(wyniki, 'potencjalneNumery.json');
console.log('Wyniki zapisane do pliku wyniki.json');

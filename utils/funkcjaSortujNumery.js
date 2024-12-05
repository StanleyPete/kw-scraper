const fs = require('fs');
const path = require('path');

function przetworzKsiegi(sciezkaPlikuJSONWydzialy) {
    let kodyWydzialoweSadow;

    try {
        const jsonData = fs.readFileSync(sciezkaPlikuJSONWydzialy, 'utf8');
        kodyWydzialoweSadow = JSON.parse(jsonData);
    } catch (error) {
        console.error("Błąd odczytu pliku z kodami wydziałowymi:", error);
        return;
    }

    kodyWydzialoweSadow.forEach((kod) => {
        const folderWydzialu = path.join(__dirname, kod);
        const plikKsiegi = path.join(folderWydzialu, 'wszystkieKsiegi.json');

        if (!fs.existsSync(plikKsiegi)) {
            console.warn(`Brak pliku wszystkieKsiegi.json w folderze ${folderWydzialu}`);
            return;
        }

        let wszystkieKsiegi;
        try {
            const daneKsiegi = fs.readFileSync(plikKsiegi, 'utf8');
            wszystkieKsiegi = JSON.parse(daneKsiegi);
        } catch (error) {
            console.error(`Błąd odczytu pliku wszystkieKsiegi.json dla ${kod}:`, error);
            return;
        }

        for (let numerKoncowaCyfra = 0; numerKoncowaCyfra <= 9; numerKoncowaCyfra++) {
          
            const ksiegiKonczaceSieNaCyfre = wszystkieKsiegi.filter(ksiega =>
                ksiega.numerKsiegiWieczystej.endsWith(numerKoncowaCyfra.toString()));

            for (let cyfraKontrolna = 0; cyfraKontrolna <= 9; cyfraKontrolna++) {
                const ksiegiDlaCyfryKontrolnej = ksiegiKonczaceSieNaCyfre.filter(ksiega =>
                    ksiega.cyfraKontrolna === cyfraKontrolna);

                if (ksiegiDlaCyfryKontrolnej.length > 0) {
                    const folderCyfraKontrolna = path.join(
                        folderWydzialu,
                        numerKoncowaCyfra.toString(),
                        cyfraKontrolna.toString()
                    );

                    if (!fs.existsSync(folderCyfraKontrolna)) {
                        try {
                            fs.mkdirSync(folderCyfraKontrolna, { recursive: true });
                        } catch (error) {
                            console.error(`Nie udało się utworzyć folderu ${folderCyfraKontrolna}:`, error);
                            continue;
                        }
                    }

                    const plikWyjsciowy = path.join(folderCyfraKontrolna, 'potencjalneNumery.json');
                    try {
                        fs.writeFileSync(plikWyjsciowy, JSON.stringify(ksiegiDlaCyfryKontrolnej, null, 2), 'utf8');
                        console.log(`Zapisano plik ${plikWyjsciowy}`);
                    } catch (error) {
                        console.error(`Błąd zapisu pliku dla folderu ${folderCyfraKontrolna}:`, error);
                    }
                }
            }
        }
    });
}


const sciezkaPlikuJSONWydzialy = path.join(__dirname, '..', 'kodyWydzialoweSadow.json');
przetworzKsiegi(sciezkaPlikuJSONWydzialy);

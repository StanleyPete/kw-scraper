const fs = require('fs');
const path = require('path');


function usunPliki(folder, nazwaPlikuDoUsuniecia) {
    try {
        const elementyFolderu = fs.readdirSync(folder, { withFileTypes: true });
        elementyFolderu.forEach((element) => {
            const pelnaSciezka = path.join(folder, element.name);

            if (element.isDirectory()) {
               
                usunPliki(pelnaSciezka, nazwaPlikuDoUsuniecia);
            } else if (element.isFile() && element.name === nazwaPlikuDoUsuniecia) {
                try {
                    fs.unlinkSync(pelnaSciezka);
                    console.log(`Usunięto plik: ${pelnaSciezka}`);
                } catch (error) {
                    console.error(`Błąd przy usuwaniu pliku ${pelnaSciezka}:`, error);
                }
            }
        });
    } catch (error) {
        console.error(`Błąd przy przetwarzaniu folderu ${folder}:`, error);
    }
}

const poczatkowyFolder = __dirname; 
const nazwaPliku = 'wszystkieKsiegi.json'; 

usunPliki(poczatkowyFolder, nazwaPliku);

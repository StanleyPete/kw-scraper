const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const otworzZakladkeOrazZapiszDoPdf = require('./lib/otworz-zakladke-oraz-zapisz-do-pdf');
const otworzZakladkeOrazPobierzNumeryKwWyodrebionychLokali = require('./lib/otworz-zakladke-oraz-pobierz-numery-kw-wyodrebnionych-lokali');
const otworzZakladkeOrazPobierzDaneOLokalach = require('./lib/otworz-zakladke-oraz-dane-o-lokalach');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: 'http://localhost:3000',
    }),
);
app.use(express.json());

app.post('/zapis-pdf', async (req, res) => {
    try {
    // Parametry/właściwości przekazane z front-end
        console.log(req.body);
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania, uzyjTor } = req.body;

        // Otwarcie przeglądarki
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                ...(uzyjTor ? ['--proxy-server=socks5://127.0.0.1:9050'] : [])
            ],
        });

        // Uruchamianie operacji równocześnie
        const wyszukajKsiegiOrazZapisz = ksiegi.map((ksiega, index) =>
            otworzZakladkeOrazZapiszDoPdf(
                ksiega,
                index,
                browser,
                stronyDzialyDoPobrania,
                typKsiegi,
            ),
        );

        // Oczekiwanie na zakończenie zapisu dla wszystkich ksiąg
        await Promise.all(wyszukajKsiegiOrazZapisz);

        await browser.close();

        res.status(200).json({
            message: 'Zrzut ekranu w pdf zapisany!',
        });
    } catch (error) {
        console.error('Błąd podczas scrapowania strony:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas scrapowania' });
    }
});


app.post('/pobierz-dane-o-lokalach', async (req, res) => {
    try {
        console.log(req.body);
        const { numerKsiegi, uzyjTor } = req.body;

        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                ...(uzyjTor ? ['--proxy-server=socks5://127.0.0.1:9050'] : [])
            ],
        });

        const wszystkieNumeryKwWyodrebnionychLokali = await otworzZakladkeOrazPobierzNumeryKwWyodrebionychLokali(numerKsiegi, browser);

      

        if(wszystkieNumeryKwWyodrebnionychLokali.message && wszystkieNumeryKwWyodrebnionychLokali.message === 'Nie znaleziono budynków w księdze wieczystej'){
            await browser.close();
            return res.status(200).json({
                message: wszystkieNumeryKwWyodrebnionychLokali.message, 
            });
        }
        await browser.close();

        const wszystkieDaneOLokalach = [];
        const batchSize = 5;

        const przetworzBatch = async (batch) => {
            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    ...(uzyjTor ? ['--proxy-server=socks5://127.0.0.1:9050'] : [])
                ],
            });

            try{
                const operacje = batch.map((ksiega, index) =>
                    otworzZakladkeOrazPobierzDaneOLokalach(ksiega, index, browser)
                        .then(daneLokalu => wszystkieDaneOLokalach.push(daneLokalu))
                );
                await Promise.all(operacje);
            } finally {
                // await browser.close();
            }
        };

        // Przetwarzanie wsadowe
        for (let i = 0; i < wszystkieNumeryKwWyodrebnionychLokali.length; i += batchSize) {
            const batch = wszystkieNumeryKwWyodrebnionychLokali.slice(i, i + batchSize);
            await przetworzBatch(batch);
        }

        console.log(wszystkieDaneOLokalach);

  

        res.status(200).json({
            message: 'Pobrano!',
        });

    } catch (error) {
        console.error('Błąd podczas scrapowania strony:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas scrapowania' });
    }
    

    
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

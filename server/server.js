const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const zapiszDoPdf = require('./lib/zapisz-do-pdf');
const pobierzNumeryKwWyodrebnionychLokali = require('./lib/pobierz-numery-kw-wyodrebnionych-lokali');
const pobierzDaneOLokalach = require('./lib/pobierz-dane-o-lokalach');
const posortujLokale = require('./lib/sortuj-pobrane-lokale');
const zapiszPlikExcel = require('./lib/zapisz-do-excel');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: 'http://localhost:3000',
    }),
);
app.use(express.json());

//ENDPOINT ZAPISZ DO PDF
app.post('/zapis-pdf', async (req, res) => {
    try {
        console.log(req.body);
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania, uzyjTor } = req.body;

        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                ...(uzyjTor ? ['--proxy-server=socks5://127.0.0.1:9050'] : [])
            ],
        });

        const wyszukajKsiegiOrazZapisz = ksiegi.map((ksiega, index) =>
            zapiszDoPdf(
                ksiega,
                index,
                browser,
                stronyDzialyDoPobrania,
                typKsiegi,
            ),
        );

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

//ENDPOINT POBIERZ DANE O LOKALACH
app.post('/pobierz-dane-o-lokalach', async (req, res) => {
    try {
        console.log(req.body);
        const { numerKsiegi, uzyjTor } = req.body;

        //Otwarcie przegladarki w celu pobrania wszystkich numerów ksiąg wieczystych dla wyodrębnionych lokali
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                ...(uzyjTor ? ['--proxy-server=socks5://127.0.0.1:9050'] : [])
            ],
        });

        //Pobranie wszystkich numerów ksiąg dla wyodrębnionych lokali
        const wszystkieNumeryKwWyodrebnionychLokali = await pobierzNumeryKwWyodrebnionychLokali(numerKsiegi, browser);


        if(wszystkieNumeryKwWyodrebnionychLokali.message && wszystkieNumeryKwWyodrebnionychLokali.message === 'Nie znaleziono budynków w księdze wieczystej'){
            await browser.close();
            return res.status(200).json({
                message: wszystkieNumeryKwWyodrebnionychLokali.message, 
            });
        }

        await browser.close();

        //Tablica do której zapisywane są obiekty z danymi wyodrębnionego lokalu
        const wszystkieDaneOLokalach = [];
        
        //Ilość jednocześnie przetwarzanych wyodrębnionch lokali
        const batchRozmiar = 5;

        //Funkcja otwierająca przeglądarki dla wielu wyodrębnionych lokali
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

            try {
                const pobierzDaneDlaBatch = batch.map((ksiega, index) => {
                    return new Promise(async (resolve) => {
                        //Sekundowe opóźnienie w otwieraniu każdej instancji przeglądarki
                        await new Promise(r => setTimeout(r, index * 1000));
                        const daneLokalu = await pobierzDaneOLokalach(ksiega, browser);
                        //Dodanie pobranych danych do globalnej tabeli
                        wszystkieDaneOLokalach.push(daneLokalu);
                        resolve();
                    });
                });
        
                await Promise.all(pobierzDaneDlaBatch);
            } finally {
                await browser.close();
            }
        };

        for (let i = 0; i < wszystkieNumeryKwWyodrebnionychLokali.length; i += batchRozmiar) {
            const batch = wszystkieNumeryKwWyodrebnionychLokali.slice(i, i + batchRozmiar);
            await przetworzBatch(batch);
        }

        //Sortowanie pobranych danych:
        const posortowaneDaneOLokalach = await posortujLokale(wszystkieDaneOLokalach);

        //Zapis finalnego pliku
        zapiszPlikExcel(posortowaneDaneOLokalach, `${numerKsiegi.kodWydzialu}-${numerKsiegi.numerKsiegiWieczystej}-${numerKsiegi.cyfraKontrolna}`);

        res.status(200).json({
            message: 'Pobrano i zapisano!',
        });

    } catch (error) {
        console.error('Błąd podczas scrapowania strony:', error);
        res.status(500).json({ error: 'Wystąpił błąd podczas scrapowania' });
    }
      
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


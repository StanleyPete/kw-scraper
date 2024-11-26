const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const otworzZakladkeOrazZapiszDoPdf = require('./lib/otworz-zakladke-oraz-zapisz-do-pdf');

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
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body;

        // Otwarcie przeglądarki
        const browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

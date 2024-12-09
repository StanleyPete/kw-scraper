const zaladowanieStrony = require('./zaladowanie-strony');

const otworzZakladkeOrazPobierzNumeryWyodrebionychLokali = async (numerKwWyodrebnionegoLokalu, browser) => {
     
    const page = await browser.newPage();
    // Ustawienia strony
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    );
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    });
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const session = await page.createCDPSession();
    await session.send(`Emulation.setFocusEmulationEnabled`, { enabled: true });

    await page.goto(
        'https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false',
        { 
            timeout: 120000,
            waitUntil: 'load' },
    );

    await zaladowanieStrony(page, 5, 'strona-główna');

    await page.type('#kodWydzialuInput', numerKwWyodrebnionegoLokalu.kodWydzialu);

    await page.type('#numerKsiegiWieczystej', numerKwWyodrebnionegoLokalu.numerKsiegiWieczystej);

    await page.type('#cyfraKontrolna', numerKwWyodrebnionegoLokalu.cyfraKontrolna);

    await page.click('#wyszukaj');

    await zaladowanieStrony(page, 5, 'wyniki-wyszukiwania');

    await page.click('#przyciskWydrukZwykly');

    await zaladowanieStrony(page, 5, 'księga');

    //Sprawdzenie czy istnieje td o tekscie 'Budynki'
    const znalezionoBudynki = await page.evaluate(() => {
        const element = Array.from(document.querySelectorAll('td.csPodTytulClean'))
            .find(td => td.textContent.trim() === 'Budynki');
        return element !== undefined; 
    });

    if (!znalezionoBudynki) {
        return {message: 'Nie znaleziono budynków w księdze wieczystej'};
    }

    await page.click(`input[value="Dział II"]`);

    await zaladowanieStrony(page, 5, 'księga');
    
    const numeryKwWyodrebnionychLokali = await page.evaluate(() => {
        //Znalezienie wszystkich elementów td o klasie csDane
        const elementyTd = Array.from(document.querySelectorAll('td.csDane'));
        const wszystkieNumeryKwWyodrebnionychLokali = [];

        //Iteracja po wszystkich elementach td i znalezienie elementów z tekstem 'Numer księgi'
        for (let i = 0; i < elementyTd.length; i++) {
            const textContent = elementyTd[i].textContent.trim();
            
            if (textContent === 'Numer księgi') {
                // Sprawdzedznie czy istnieje następny element td obok elementu z tekstem 'Numer księgi
                const nextTd = elementyTd[i].nextElementSibling;
                if (nextTd && nextTd.classList.contains('csDane')) {
                    //Usunięcie spacji wewnątrz numeru księgi wyodrębnionego lokalu
                    const numerKwWyodrebnionegoLokalu = nextTd.textContent.trim().replace(/\s+/g, '');
                    //Destrukturyzacja wszystkich części numeru księgi wyodrębnionego lokalu
                    const [kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna] = numerKwWyodrebnionegoLokalu.split('/');

                    // Dodadanie obiektu do tabeli wszystkieNumeryKwWyodrebnionychLokali
                    wszystkieNumeryKwWyodrebnionychLokali.push({
                        kodWydzialu,
                        numerKsiegiWieczystej,
                        cyfraKontrolna,
                    });
                }
            }
        }
        
        return wszystkieNumeryKwWyodrebnionychLokali;
    });

    return numeryKwWyodrebnionychLokali;
};

module.exports = otworzZakladkeOrazPobierzNumeryWyodrebionychLokali;
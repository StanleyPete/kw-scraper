const zaladowanieStrony = require('./zaladowanie-strony');

const pobierzDaneOLokalach = async(ksiega, browser ) => {

    const context = await browser.createBrowserContext();
    const page = await context.newPage();

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

    // Zasymulowanie focusa na kazdej ze stron
    const session = await page.createCDPSession();
    await session.send(`Emulation.setFocusEmulationEnabled`, { enabled: true });

    await page.goto(
        'https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false',
        { 
            timeout: 120000,
            waitUntil: 'load' },
    );

    await zaladowanieStrony(page, 5, 'strona-główna');

    await page.type('#kodWydzialuInput', ksiega.kodWydzialu);
    await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej);
    await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna);
    await page.click('#wyszukaj');
    await zaladowanieStrony(page, 5, 'wyniki-wyszukiwania');
    await page.click('#przyciskWydrukZwykly');
    await zaladowanieStrony(page, 5, 'księga');

    let wyodrebnionyLokal = {
        numerKsiegiWieczystej: `${ksiega.kodWydzialu}/${ksiega.numerKsiegiWieczystej}/${ksiega.cyfraKontrolna}`,
        ulica: '',
        numerBudynku: '',
        numerLokalu: '',
        powierzchnia: '',
        udzial: ''
    };


    //Pobieranie adresu
    const ulicaNumerBudynkuNumerLokalu = await page.evaluate(() => {
        const elementUlica = Array.
            from(document.querySelectorAll('td.csDane')).
            find(el => el.textContent.trim() === 'Ulica');

        if (!elementUlica) {
            return { ulica: '', numerBudynku: '', numerLokalu: '' };
        }
    
        const elementyCsBDane = [];
        let aktualnyElement = elementUlica.nextElementSibling;
    
        while (aktualnyElement && elementyCsBDane.length < 3) {

            if (aktualnyElement.classList.contains('csBDane')) {
                elementyCsBDane.push(aktualnyElement.textContent.trim());
            }

            aktualnyElement = aktualnyElement.nextElementSibling;
        }
    
        const [ulica, numerBudynku, numerLokalu] = [
            elementyCsBDane[0] || '',
            elementyCsBDane[1] || '',
            elementyCsBDane[2] || ''
        ];
    
        return { ulica, numerBudynku, numerLokalu };
    });

    wyodrebnionyLokal.ulica = ulicaNumerBudynkuNumerLokalu.ulica;
    wyodrebnionyLokal.numerBudynku = ulicaNumerBudynkuNumerLokalu.numerBudynku;
    wyodrebnionyLokal.numerLokalu = ulicaNumerBudynkuNumerLokalu.numerLokalu;

    //Pobieranie powierzchnii lokalu
    wyodrebnionyLokal.powierzchnia = await page.evaluate(() => {
        const elementyTd = Array.from(document.querySelectorAll('td.csDane'));

        for (let i = 0; i < elementyTd.length; i++) {
            const textContent = elementyTd[i].textContent.trim();
            
            if (textContent === 'Pole powierzchni użytkowej lokalu wraz z powierzchnią pomieszczeń przynależnych') {
                // Sprawdzedznie czy istnieje następny element td obok elementu z tekstem textContent
                const nextTd = elementyTd[i].nextElementSibling;
                if (nextTd && nextTd.classList.contains('csBDane')) {
                    return nextTd.textContent.trim();
                }
            }
        }
        return ''; 
    });

    await page.click(`input[value="Dział I-Sp"]`);
    await zaladowanieStrony(page, 5, 'księga');

    //Pobieranie udzialu
    wyodrebnionyLokal.udzial = await page.evaluate(() => {
        const elementyTd = Array.from(document.querySelectorAll('td.csDane'));

        for (let i = 0; i < elementyTd.length; i++) {
            const textContent = elementyTd[i].textContent.trim();
            
            if (textContent === 'Wielkość udziału w nieruchomości wspólnej, którą stanowi grunt oraz części budynku i urządzenia, które nie służą wyłącznie do użytku właścicieli lokali') {
                // Sprawdzedznie czy istnieje następny element td obok elementu z tekstem textContent
                let nextElement = elementyTd[i].nextElementSibling;

                while (nextElement && !nextElement.classList.contains('csDane')) {
                    nextElement = nextElement.nextElementSibling;
                }

                if (nextElement) {
                    return nextElement.textContent.trim();
                }
            }
        }
        return ''; 
    });

    await page.close();
    return wyodrebnionyLokal;

};

module.exports = pobierzDaneOLokalach;
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const zaladowanieStrony = require('./zaladowanie-strony');

// Pętla iterująca po wszystkich księgach przekazanych z front-end
const otworzZakladkeOrazZapiszDoPdf = async (ksiega, index, browser, stronyDzialyDoPobrania, typKsiegi
) => {
    // Opóźnienie przed tworzeniem nowej zakładki
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(index * 100);

    // Nowa zakładka
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

    // Wypełnienie formularza:
    await page.type('#kodWydzialuInput', ksiega.kodWydzialu);
    await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej);
    await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna);

    // Szukaj:
    await page.click('#wyszukaj');

    await zaladowanieStrony(page, 5, 'wyniki-wyszukiwania');

    // Sprawdzenie typu księgi przekazanej z front-end
    if (typKsiegi === 'Aktualna treść KW') {
        await page.click('#przyciskWydrukZwykly');
    } else if (typKsiegi === 'Zupełna treść KW') {
        await page.click('#przyciskWydrukZupelny');
    } else if (typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
        await page.click('#przyciskWydrukDotychczasowy');
    }

    await zaladowanieStrony(page, 5, 'księga');

    // Utworzenie pliku pdf do którego zapisywane są strony/działy
    const dokumentPdf = await PDFDocument.create();

    // Pętla iterująca po wszystkich stronach/działach przekazanych z front-end
    for (const stronaDzial of stronyDzialyDoPobrania) {
    // Wejście do odpowiedniej strony/działu
        await page.click(`input[value="${stronaDzial}"]`);

        await zaladowanieStrony(page, 5, 'księga');

        // Sprawdzanie wymiarów strony
        const wymiaryStrony = await page.evaluate(() => {
            return {
                width: document.documentElement.scrollWidth,
                height: document.body.clientHeight,
            };
        });

        // Ustawienie wymiarów viewport do PDF
        await page.setViewport({
            width: wymiaryStrony.width,
            height: wymiaryStrony.height,
        });

        // Tworzenie pdf dla wybranej strony/działu:
        const pdfBuffer = await page.pdf({
            printBackground: true,
            width: `${wymiaryStrony.width}px`,
            height: `${wymiaryStrony.height}px`,
            fullPage: true,
        });

        // Ładowanie PDF do pdf-lib
        const tymczasowyPdf = await PDFDocument.load(pdfBuffer);

        // Iteracja przez wszystkie strony załadowanego dokumentu
        const stronyDoDodania = await dokumentPdf.copyPages(
            tymczasowyPdf,
            tymczasowyPdf.getPageIndices(),
        );

        stronyDoDodania.forEach((page) => dokumentPdf.addPage(page));
    }

    // Zapis finalnego pliku pdf:
    const sciezkaPdf = path.join(
        __dirname,
        '..',
        '..',
        `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.pdf`,
    );
    const ostatecznyPdf = await dokumentPdf.save();
    fs.writeFileSync(sciezkaPdf, ostatecznyPdf);

    // Zamknij stronę po zakończeniu
    await page.close();
};

module.exports = otworzZakladkeOrazZapiszDoPdf;

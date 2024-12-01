const { PDFDocument } = require('pdf-lib')
const { Packer, Document, Paragraph, TextRun } = require('docx')
const fs = require('fs')
const path = require('path')
const { wklejTekstDoTxt, kopiujTekstZTxt, wklejTekstDoWord, usunTxt } = require('./funkcje-ahk')
const poczekajNaZaladowanieStrony = require('./funkcja-zaladowanie-strony')
const zaznaczTekstOrazSkopiujDoSchowka = require('./funkcja-zaznacz-kopiuj-tekst')


//FUNKCJA OTWÓRZ ZAKŁADKĘ
const otworzZakladkeOrazScrapuj = async (ksiega, index, browser, stronyDzialyDoPobrania, typKsiegi, opcjeZapisu, pozostawOtwartaPrzegladarke) => {
            
    // Opóźnienie przed tworzeniem nowej zakładki
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    await delay(index * 1000)

    const page = await browser.newPage()

    //Ustawienia strony
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 800 })
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    })  
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })

    // Zasymulowanie focusa na kazdej ze stron
    const session = await page.createCDPSession();
    await session.send(`Emulation.setFocusEmulationEnabled`, { enabled: true });

    await page.goto('https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false', { waitUntil: 'load' })
    
    await poczekajNaZaladowanieStrony(page, 5, 'strona-główna')
    
    await page.type('#kodWydzialuInput', ksiega.kodWydzialu)
    await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej)
    await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna)

    await page.click('#wyszukaj')

    await poczekajNaZaladowanieStrony(page, 5, 'wyniki-wyszukiwania')

    if (typKsiegi === 'Aktualna treść KW') {
        await page.click('#przyciskWydrukZwykly')
    } else if (typKsiegi === 'Zupełna treść KW') {
        await page.click('#przyciskWydrukZupelny')
    } else if (typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
        await page.click('#przyciskWydrukDotychczasowy')
    }
    
    await poczekajNaZaladowanieStrony(page, 5, 'księga')

    let pdfDoc
    let doc

    if(opcjeZapisu.PDF){
        //Utworzenie pliku pdf, do którego zapisywane są strony/działy
        pdfDoc = await PDFDocument.create()
    }

    if(opcjeZapisu.DOCX){
        //Utworzenie plidku word, do którego zapisywane są informacje z ksiąg
        doc = new Document({
            creator: "MPV",  
            title: "Wypis z księgi wieczystej", 
            subject: "Wypis z księgi wieczystej",
            sections: [
            ],
        })
    }


    //PĘTLA INTERUJĄCA PO WSZYSTKICH DZIAŁACH PRZESŁANYCH Z FRONT END:
    for (const stronaDzial of stronyDzialyDoPobrania) {

        //Wejście do odpowiedniej strony/działu
        await page.click(`input[value="${stronaDzial}"]`)

        //Oczekiwanie na zakończenie zapytania sieciowego
        await poczekajNaZaladowanieStrony(page, 5, 'księga')
    
        // Sprawdzanie wymiarów strony
        const dimensions = await page.evaluate(() => {
            return {
                width: document.documentElement.scrollWidth,
                height: document.body.clientHeight,
            }
        })

        //Ustawienie wymiarów viewport do PDF
        await page.setViewport({
            width: dimensions.width,
            height: dimensions.height 
        })

        if(opcjeZapisu.DOCX || opcjeZapisu.TXT) {

            if(stronaDzial === 'Dział I-O'){

                if(opcjeZapisu.DOCX){

                    //Pobieranie numeru księgi
                    const numerKsiegi = await page.evaluate(() => {
                        return document.querySelector('h2 b').innerText
                    })
        
                    //Pobieranie nazwy Sądu z nagłówka h4 i modyfikacja w celu uzyskania tylko i wyłącznie nazwy Sądu
                    const sadRejonowy = await page.evaluate(() => {
                        const naglowekH4 = document.querySelector('h4').innerText
                        let tekstSformatowany = ''
                        for (let i = 0; i < naglowekH4.length; i++) {
                            if (naglowekH4[i] === naglowekH4[i].toUpperCase() || !/[a-z]/.test(naglowekH4[i])) {
                                tekstSformatowany += naglowekH4[i];
                            }
                        }
                        const finalnyTekstSformatowany = tekstSformatowany.split(' -')[0]
                        return finalnyTekstSformatowany
                    })
        
                    //Pobieranie rodzaju księgi
                    const rodzajKsiegi = await page.evaluate(() => {
                        const tekst = document.querySelector('h3').innerText
                        return tekst.charAt(0).toUpperCase() + tekst.slice(1).toLowerCase()
                    })
        
                    const aktualnaData = new Date()
                    const dzien = String(aktualnaData.getDate()).padStart(2, '0')
                    const miesiac = String(aktualnaData.getMonth() + 1).padStart(2, '0')
                    const rok = aktualnaData.getFullYear()
                    const formattedDate = `${dzien}.${miesiac}.${rok}`
        
                    const akapitPierwszy= new Paragraph({
                        children: [
                            new TextRun(`Dla przedmiotowej nieruchomości${sadRejonowy} prowadzi księgę wieczystą nr `),
                            new TextRun({ text: `${numerKsiegi}`, bold: true }),
                        ]
                    })
        
                    const akapitDrugi = new Paragraph({
                        children: [
                            new TextRun({ text: '', break: 1 }),
                            new TextRun('W poszczególnych działach '),
                            new TextRun({ text: `Księgi Wieczystej nr ${numerKsiegi} `, bold: true }),
                            new TextRun(`zapisano - według stanu z dnia ${formattedDate} roku:`),
                        ]
                    })
        
                    const oznaczenieKsiegiWieczystej =  new Paragraph({
                        children: [
                            new TextRun({ text: 'OZNACZENIE KSIĘGI WIECZYSTEJ', bold: true }),
                            new TextRun({ text: '', break: 1 }),
                            new TextRun({ text: 'Typ księgi:', underline: true }),
                            new TextRun({ text: '', break: 1 }),
                            new TextRun(`${rodzajKsiegi}`)
                        ]
                    })
        
                    doc.addSection({
                        children: [akapitPierwszy, akapitDrugi, oznaczenieKsiegiWieczystej]
                    })
                }
    
                const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ I-O - OZNACZENIE NIERUCHOMOŚCI', 'DOKUMENTY BĘDĄCE PODSTAWĄ WPISU / DANE O WNIOSKU', stronaDzial)
                // console.log(zaznaczonyTekst) //Tylko na potrzeby podglądu
    
                await wklejTekstDoTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
            } 
    
            if(stronaDzial === 'Dział I-Sp' ){
                const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ I-SP - SPIS PRAW ZWIĄZANYCH Z WŁASNOŚCIĄ', 'DOKUMENTY BĘDĄCE PODSTAWĄ WPISU / DANE O WNIOSKU', stronaDzial)
                // console.log(zaznaczonyTekst) //Tylko na potrzeby podglądu
                
                await wklejTekstDoTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
            }
    
            if(stronaDzial === 'Dział II' ){
                const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ II - WŁASNOŚĆ', 'Powrót', stronaDzial)
                // console.log(zaznaczonyTekst) //Tylko na potrzeby podglądu
                
                await wklejTekstDoTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
            }
            
            if(stronaDzial === 'Dział III' ){
                const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ III - PRAWA, ROSZCZENIA I OGRANICZENIA', 'DOKUMENTY BĘDĄCE PODSTAWĄ WPISU / DANE O WNIOSKU', stronaDzial)
    
                // console.log(zaznaczonyTekst) //Tylko na potrzeby podglądu
                
                await wklejTekstDoTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
            }
    
            if(stronaDzial === 'Dział IV' ){
                const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ IV - HIPOTEKA', 'DOKUMENTY BĘDĄCE PODSTAWĄ WPISU / DANE O WNIOSKU')
                // console.log(zaznaczonyTekst) //Tylko na potrzeby podglądu
                
                await wklejTekstDoTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
            }
        }

        if(opcjeZapisu.PDF){
            //Tworzenie pdf dla wybranej strony/działu:
            const pdfBuffer = await page.pdf({
                printBackground: true,
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                fullPage: true
            })
    
            //Ładowanie PDF do pdf-lib
            const tempPdfDoc = await PDFDocument.load(pdfBuffer)
    
            //Iteracja przez wszystkie strony załadowanego dokumentu
            const pagesToAdd = await pdfDoc.copyPages(tempPdfDoc, tempPdfDoc.getPageIndices())
    
            //Dodawanie stron do pdfDoc
            pagesToAdd.forEach(page => pdfDoc.addPage(page)) 
        }

    }

    if(opcjeZapisu.PDF){
        //Zapis dokument pdf:
        const pdfPath = path.join(__dirname, '..', '..', `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.pdf`)
        const finalPdfBytes = await pdfDoc.save()
        fs.writeFileSync(pdfPath, finalPdfBytes)
    }

    if(opcjeZapisu.DOCX){
        // Zapisz dokument Word
        const wordPath = path.join(__dirname, '..', '..', `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.docx`)
        const buffer = await Packer.toBuffer(doc)
        fs.writeFileSync(wordPath, buffer)
        await kopiujTekstZTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
        await wklejTekstDoWord(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
    }

    if(!pozostawOtwartaPrzegladarke){
        await page.close()
    }

    if(!opcjeZapisu.TXT){
        await usunTxt(`${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}`)
    }
}

module.exports = otworzZakladkeOrazScrapuj
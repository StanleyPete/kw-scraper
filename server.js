const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')
const { Document, Packer, Paragraph, TextRun } = require('docx')
const { exec } = require('child_process')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
  }))
app.use(express.json())

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

app.post('/scrape', async (req, res) => {

    //Załadowanie strony
    const poczekajNaZaladowanieStrony = async (page, maxLiczbaProb = 5, strona) => {
        let attempt = 0
    
        while (attempt < maxLiczbaProb) {
            try {
                await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 })
                return
            } catch {
                try {
                    if (strona === 'strona-główna'){
                        await page.waitForSelector('button#wyszukaj', { timeout: 5000 })
                    } else if (strona === 'wyniki-wyszukiwania'){
                        await page.waitForSelector('button#powrotDoMenuGlownego', { timeout: 5000 })
                    } else if (strona === 'księga'){
                        await page.waitForSelector('input[value="Powrót"]', { timeout: 5000 })
                    }
                    return
                } catch (error) {
                    attempt++
                    if (attempt < maxLiczbaProb) {
                        await page.reload({ waitUntil: 'load' })
                    } else {
                        throw new Error('Błąd ładowania strony po maksymalnej liczbie prób.')
                    }  
                }
            }
        }
    }


    //Funkcja zapisz do txt przy pomocy AutoHotKey:
    const zapiszDoTxtAhk = async () => {
        return new Promise((resolve, reject) => {
            const sciezkaDoAhk = '"C:\\Program Files\\AutoHotkey\\AutoHotkeyU64.exe"'
            const sciezkaDoSkryptuAhk = path.join(__dirname, 'script.ahk')
            const sciezkaPlikuTxt = path.join(__dirname, 'file.txt')
            
            exec(`${sciezkaDoAhk} "${sciezkaDoSkryptuAhk}" "${sciezkaPlikuTxt}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Błąd przy uruchamianiu AHK: ${error}`)
                    reject(error)
                    return
                }
                console.log(`Skrypt AHK zakończony: ${stdout}`)
                resolve(stdout)
            })
        })
    }
   
    const zaznaczTekstOrazSkopiujDoSchowka = async (page, startTekst, endTekst) => {
        const zaznaczonyTekst = await page.evaluate((startTekst, endTekst) => {
            // Szukanie elementów o klasie 'csTTytul' zawierających tekst przekazany w parametrach funkcji
            const startElement = Array.from(document.querySelectorAll('td.csTTytul'))
                .find(el => el.textContent.includes(startTekst))

            const endElement = Array.from(document.querySelectorAll('td.csTTytul'))
                .find(el => el.textContent.includes(endTekst))
            
            if (!startElement || !endElement) {
                return null
            }
    
            // Tworzenie nowego zakresu:
            const zakres = document.createRange()
    
            // Ustawianie początku zaznaczenia na początku startTekst
            zakres.setStart(startElement.firstChild, 0)
    
            // Pobieramy tekst z elementu końcowego
            const endTextNode = endElement.firstChild
            
            // Ustawianie końca zaznaczenia na miejscu przed końcem endTekst
            zakres.setEnd(endTextNode, 0)
    
            //Usuwanie poprzednich zaznaczeń:
            const selection = window.getSelection()
            selection.removeAllRanges()

            //Ustawienie zaznaczenia:
            selection.addRange(zakres)
    
            //Kopiowanie tekstu do schowka
            document.execCommand('copy')
    
            // Zwracanie skopiowanego tekstu (test only)
            return selection.toString()
        }, startTekst, endTekst)
    
        if (zaznaczonyTekst === null) {
            throw new Error(`Nie znaleziono tekstu "${startTekst}" lub "${endTekst}" na stronie.`)
        }
    
        return zaznaczonyTekst
    }

    //SCRAPOWANIE STRONY:
    try {
        //Parametry/właściwości przekazane z front-end oraz ich podgląd
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body
        console.log(req.body)
        
    
        const browser = await puppeteer.launch({
            headless: false, 
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', 
            ],
        })

        //FUNKCJA OTWÓRZ ZAKŁADKĘ
        const otworzZakladke = async (ksiega, index) => {
            
            // Opóźnienie przed tworzeniem nowej zakładki
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


            //Utworzenie pliku pdf, do którego zapisywane są strony/działy
            const pdfDoc = await PDFDocument.create()

            //Utworzenie plidku word, do którego zapisywane są informacje z ksiąg
            const doc = new Document({
                creator: "MPV",  
                title: "Wypis z księgi wieczystej", 
                subject: "Wypis z księgi wieczystej",
                sections: [
                ],
            })

        
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

                if(stronaDzial === 'Dział I-O'){
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

                    //Sprawdzenie zaznaczonego tekstu (tylko podgląd)
                    const zaznaczonyTekst = await zaznaczTekstOrazSkopiujDoSchowka(page, 'DZIAŁ I-O - OZNACZENIE NIERUCHOMOŚCI', 'DOKUMENTY BĘDĄCE PODSTAWĄ WPISU / DANE O WNIOSKU')
                    console.log(zaznaczonyTekst)

                    await zapiszDoTxtAhk()
                }      

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

            //Zapis dokument pdf:
            const pdfPath = path.join(__dirname, `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.pdf`)
            const finalPdfBytes = await pdfDoc.save()
            fs.writeFileSync(pdfPath, finalPdfBytes)

            // Zapisz dokument Word
            const wordPath = path.join(__dirname, `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.docx`)
            const buffer = await Packer.toBuffer(doc)
            fs.writeFileSync(wordPath, buffer)

            await page.close()
        }

        //Uruchom wuszykaj i zapisz dla wszystkich ksiąg
        const wyszukajKsiegiOrazZapisz = ksiegi.map((ksiega, index) => otworzZakladke(ksiega, index))
      
        //Oczekiwanie na zakończenie zapisu dla wszystkich ksiąg
        await Promise.all(wyszukajKsiegiOrazZapisz)

        await browser.close()

        res.status(200).json({
            message: 'Zrzut ekranu w pdf zapisany!',
        })
    } catch (error) {
        console.error('Błąd podczas scrapowania strony:', error)
        res.status(500).json({ error: 'Wystąpił błąd podczas scrapowania' })
    }
    
    
})







app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
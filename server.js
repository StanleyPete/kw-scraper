const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')
const { Document, Packer, Paragraph, TextRun } = require('docx');

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
    const poczekajNaZaladowanieStrony = async (page, maxRetries = 5, strona) => {
        let attempt = 0
    
        while (attempt < maxRetries) {
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
                    if (attempt < maxRetries) {
                        await page.reload({ waitUntil: 'load' })
                    } else {
                        throw new Error('Błąd ładowania strony po maksymalnej liczbie prób.')
                    }  
                }
            }
        }
    }

   
    
    //FUNKCJA SCRAPUJACA
    try {
        //Parametry/właściwości przekazane z front-end
        console.log(req.body)
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body
        
        // Otwarcie przeglądarki
        const browser = await puppeteer.launch({
            headless: false, 
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', 
            ],
        })

       

        // Pętla iterująca po wszystkich księgach przekazanych z front-end
        const otworzZakladke = async (ksiega, index) => {
            
            // Opóźnienie przed tworzeniem nowej zakładki
            await delay(index * 1000)

            //Nowa zakładka
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

            //Wejście na stronę:
            await page.goto('https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false', { waitUntil: 'load' })
            
            await poczekajNaZaladowanieStrony(page, 5, 'strona-główna')
            
            //Wypełnienie formularza:
            await page.type('#kodWydzialuInput', ksiega.kodWydzialu)
            await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej)
            await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna)

            //Szukaj:
            await page.click('#wyszukaj')

            await poczekajNaZaladowanieStrony(page, 5, 'wyniki-wyszukiwania')

            //Sprawdzenie typu księgi przekazanej z front-end
            if (typKsiegi === 'Aktualna treść KW') {
                await page.click('#przyciskWydrukZwykly')
            } else if (typKsiegi === 'Zupełna treść KW') {
                await page.click('#przyciskWydrukZupelny')
            } else if (typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
                await page.click('#przyciskWydrukDotychczasowy')
            }
            
            await poczekajNaZaladowanieStrony(page, 5, 'księga')


            //Utworzenie pliku pdf do którego zapisywane są strony/działy
            const pdfDoc = await PDFDocument.create()

            const doc = new Document({
                creator: "Twój system",  // Możesz dodać własną nazwę lub pozostawić pustą
                title: "Tytuł dokumentu", // Opcjonalnie
                subject: "Temat dokumentu", // Opcjonalnie
                sections: [
                ],
            });
                    
            //Pętla iterująca po wszystkich stronach/działach przekazanych z front-end
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
                    const numerKsiegi = await page.evaluate(() => {
                        return document.querySelector('h2 b').innerText
                    })

                    const sadRejonowy = await page.evaluate(() => {
                        const h4Text = document.querySelector('h4').innerText
                        let cleanedText = '';
                        for (let i = 0; i < h4Text.length; i++) {
                            // Dodajemy tylko wielkie litery lub inne znaki
                            if (h4Text[i] === h4Text[i].toUpperCase() || !/[a-z]/.test(h4Text[i])) {
                                cleanedText += h4Text[i];
                            }
                        }
                
                        // Usuwamy wszystko po myślniku (wraz z myślnikiem)
                        const splitText = cleanedText.split(' -')[0]
                
                        return splitText
                    })
                    
                    const paragraph = new Paragraph({
                        children: [
                            new TextRun('Dla przedmiotowej nieruchomości'),
                            new TextRun(sadRejonowy),
                            new TextRun(' prowadzi księgę wieczystą nr '),
                            new TextRun(numerKsiegi,)
                        ]
                    })

                    const paragraph2 = new Paragraph({
                        children: [
                            new TextRun('W poszczególnych działach Księgi Wieczystej nr '),
                            new TextRun(numerKsiegi,),
                            new TextRun(' zapisano według stanu z dnia: '),
                        ]
                    })

                    doc.addSection({
                        children: [paragraph, paragraph2]
                    })

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

                pagesToAdd.forEach(page => pdfDoc.addPage(page))
   
            }

            
             //Zapis finalnego pliku pdf:
             const pdfPath = path.join(__dirname, `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.pdf`);
             const finalPdfBytes = await pdfDoc.save()
             fs.writeFileSync(pdfPath, finalPdfBytes)

             // Zapisz dokument Word
            const wordPath = path.join(__dirname, `${ksiega.kodWydzialu}-${ksiega.numerKsiegiWieczystej}-${ksiega.cyfraKontrolna}.docx`);
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(wordPath, buffer);

             // Zamknij stronę po zakończeniu
            await page.close()
        }

        // Uruchamianie operacji równocześnie z opóźnieniem
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
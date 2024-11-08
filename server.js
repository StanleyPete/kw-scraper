const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { PDFDocument } = require('pdf-lib')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
  }))
app.use(express.json())



app.post('/scrape', async (req, res) => {
    try {
        //Parametry/właściwości przekazane z front-end
        console.log(req.body)
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body
        
        // Otwarcie przeglądarki
        const browser = await puppeteer.launch({
            headless: true, 
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', 
            ],
        })

        // Pętla iterująca po wszystkich księgach przekazanych z front-end
        for(let ksiega of ksiegi) {
            //Utworzenie pliku pdf do którego zapisywane są strony/działy
            const pdfDoc = await PDFDocument.create()

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
            await page.goto('https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false', { waitUntil: 'networkidle2' })
    
            await page.waitForSelector('#wyszukaj', { visible: true })

            //Wypełnienie formularza:
            await page.type('#kodWydzialuInput', ksiega.kodWydzialu)
            await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej)
            await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna)

            //Szukaj:
            await page.click('#wyszukaj')

            await page.waitForSelector('#przyciskWydrukDotychczasowy', { visible: true })

            //Sprawdzenie typu księgi przekazanej z front-end
            if (typKsiegi === 'Aktualna treść KW') {
                await page.click('#przyciskWydrukZwykly')
            } else if (typKsiegi === 'Zupełna treść KW') {
                await page.click('#przyciskWydrukZupelny')
            } else if (typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
                await page.click('#przyciskWydrukDotychczasowy')
            }
            
            await page.waitForSelector('input[value="Powrót"]', { visible: true })

            
            //Pętla iterująca po wszystkich stronach/działach przekazanych z front-end
            for (const stronaDzial of stronyDzialyDoPobrania) {

                //Wejście do odpowiedniej strony/działu
                await page.click(`input[value="${stronaDzial}"]`);
        
                //Oczekiwanie na zakończenie zapytania sieciowego
                await page.waitForNavigation({ waitUntil: 'networkidle2' })

                const pdfPathh = path.join(__dirname, `${ksiega.numerKsiegiWieczystej}puppeter.pdf`)
               
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

                //Tworzenie pdf dla wybranej strony/działu:
                const pdfBuffer = await page.pdf({
                    path: pdfPathh,
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
        }
        
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
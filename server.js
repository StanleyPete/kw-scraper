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
        
        console.log(req.body)
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body
        
        const browser = await puppeteer.launch({
            headless: true, 
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', 
            ],
        });

        for(let ksiega of ksiegi) {
            const page = await browser.newPage()

            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            )

            await page.setViewport({ width: 1280, height: 800 });
            
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
            })
                
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false })
            })

            await page.goto('https://przegladarka-ekw.ms.gov.pl/eukw_prz/KsiegiWieczyste/wyszukiwanieKW?komunikaty=true&kontakt=true&okienkoSerwisowe=false', { waitUntil: 'networkidle2' })
    
            await page.waitForSelector('#wyszukaj', { visible: true })

            await page.type('#kodWydzialuInput', ksiega.kodWydzialu)
            await page.type('#numerKsiegiWieczystej', ksiega.numerKsiegiWieczystej)
            await page.type('#cyfraKontrolna', ksiega.cyfraKontrolna)

            await page.click('#wyszukaj')

            await page.waitForSelector('#przyciskWydrukDotychczasowy', { visible: true })

            if (typKsiegi === 'Aktualna treść KW') {
                await page.waitForSelector('#przyciskWydrukZwykly', { visible: true })
                await page.click('#przyciskWydrukZwykly')
            } else if (typKsiegi === 'Zupełna treść KW') {
                await page.waitForSelector('#przyciskWydrukZupelny', { visible: true })
                await page.click('#przyciskWydrukZupelny')
            } else if (typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
                await page.waitForSelector('#przyciskWydrukDotychczasowy', { visible: true })
                await page.click('#przyciskWydrukDotychczasowy')
            }
            
            await page.waitForSelector('input[value="Powrót"]', { visible: true })

            // Stwórz nowy dokument PDF
            const pdfDoc = await PDFDocument.create()

            for (const stronaDzial of stronyDzialyDoPobrania) {
                // Klikamy w odpowiedni input
                await page.click(`input[value="${stronaDzial}"]`);
        
                // Czekamy, aż załaduje się strona i będzie gotowa do kliknięcia "Powrót"
                await page.waitForSelector('input[value="Powrót"]', { visible: true });

                const pdfPathh = path.join(__dirname, `${ksiega.numerKsiegiWieczystej}puppeter.pdf`)
                // Robimy zrzut ekranu i dodajemy go do PDF
                const pdfStrona = await page.pdf({
                    path: pdfPathh,
                    format: 'A4',
                    printBackground: true, 
                    width: '1280px',
                    height: '800px'
                  })
                
                // Ładujemy wygenerowany PDF jako dokument pdf-lib
                const tempPdfDoc = await PDFDocument.load(pdfStrona)
                  
                // Dodajemy stronę z tego PDF do naszego głównego dokumentu
                const [pageToAdd] = await pdfDoc.copyPages(tempPdfDoc, [0])
                pdfDoc.addPage(pageToAdd);
            }


            // Zapisujemy połączony PDF
            const pdfPath = path.join(__dirname, `${ksiega.numerKsiegiWieczystej}.pdf`);
            const pdfBytes = await pdfDoc.save();
            fs.writeFileSync(pdfPath, pdfBytes); // Zapisz plik PDF na dysku

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
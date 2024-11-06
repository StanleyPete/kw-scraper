const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const fs = require('fs');
const path = require('path');

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
  }))
app.use(express.json())



app.post('/scrape', async (req, res) => {
    try {
        
        const { ksiegi } = req.body
        
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

            const pdfPath = path.join(__dirname, `${ksiega.numerKsiegiWieczystej}.pdf`)
    
            await page.pdf({
            path: pdfPath,
            format: 'A4',  
            printBackground: true,  
            width: '1280px',  
            height: '800px', 
            })

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
const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const otworzZakladkeOrazScrapuj = require('./lib/otworz-zakladke')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
  }))
app.use(express.json())

app.post('/scrape', async (req, res) => {
    try {
        const { ksiegi, typKsiegi, stronyDzialyDoPobrania } = req.body
        console.log('DANE Z FRONT-END:') // Tylko na potrzeby podglądu
        console.log(req.body)

        const browser = await puppeteer.launch({
            headless: false, 
            args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized' 
            ],
        })

        const wyszukajKsiegiOrazZapisz = ksiegi.map((ksiega, index) => otworzZakladkeOrazScrapuj(ksiega, index, browser, stronyDzialyDoPobrania, typKsiegi))
      
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
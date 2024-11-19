const zaladowanieStrony = async (page, maxRetries = 5, strona) => {
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
                    await page.waitForSelector('input[value="Powrót"]', { timeout: 5000 });
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

module.exports = zaladowanieStrony
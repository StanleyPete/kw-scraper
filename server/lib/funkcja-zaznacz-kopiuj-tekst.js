const zaznaczTekstOrazSkopiujDoSchowka = async (page, startTekst, endTekst, dzial) => {
    const zaznaczonyTekst = await page.evaluate((startTekst, endTekst, dzial) => {
        let startElement = null
        let endElement = null

        const contentDzialu = document.getElementById('contentDzialu')
        const wysokoscContentDzialu = contentDzialu.getBoundingClientRect().height
        const wysokoscContentDzialuMniejszaNiz250 = wysokoscContentDzialu < 250
        const brakWpisowElement = Array.from(document.querySelectorAll('td.csBCDane'))
        .find(el => el.textContent.includes('BRAK WPISÓW'))
        let endElementGdyNieZnalezionoDokumentow = null

     

        if(dzial === 'Dział II') {
            startElement = Array.from(document.querySelectorAll('td.csTTytul'))
            .find(el => el.textContent.includes(startTekst))

            endElement = Array.from(document.querySelectorAll('input[type="submit"]'))
            .find(el => el.value.includes(endTekst))
        } else {
            if(wysokoscContentDzialuMniejszaNiz250 && brakWpisowElement){
                startElement = Array.from(document.querySelectorAll('td.csTTytul'))
                .find(el => el.textContent.includes(startTekst))

                endElement = Array.from(document.querySelectorAll('input[type="submit"]'))
                .find(el => el.value.includes('Powrót'))

            } else {
                startElement = Array.from(document.querySelectorAll('td.csTTytul'))
                    .find(el => el.textContent.includes(startTekst))
    
                endElement = Array.from(document.querySelectorAll('td.csTTytul'))
                    .find(el => el.textContent.includes(endTekst))

                if(!endElement) {
                    endElementGdyNieZnalezionoDokumentow = Array.from(document.querySelectorAll('input[type="submit"]'))
                    .find(el => el.value.includes('Powrót'))

                    endElement = endElementGdyNieZnalezionoDokumentow
                }
            }
        }

        if (!startElement || !endElement) {
            return null
        }

        // Tworzenie nowego zakresu:
        const zakres = document.createRange()

        // Ustawianie początku zaznaczenia na początku startTekst
        zakres.setStart(startElement.firstChild, 0)
        
        // Pobieranie tekstu z elementu końcowego
        let endTextNode = null
        if(dzial === 'Dział II' || (wysokoscContentDzialuMniejszaNiz250 && brakWpisowElement) || endElementGdyNieZnalezionoDokumentow){
            endTextNode = endElement
        } else {
            endTextNode = endElement.firstChild
        }
        
        //Ustawienie końca zakresu
        if(dzial === 'Dzial II' || (wysokoscContentDzialuMniejszaNiz250 && brakWpisowElement) || endElementGdyNieZnalezionoDokumentow){
            zakres.setEnd(endElement, 0)
        }else{
            zakres.setEnd(endTextNode, 0)
        }

        //Usuwanie poprzednich zaznaczeń:
        const selection = window.getSelection()
        selection.removeAllRanges()

        //Ustawienie zaznaczenia:
        selection.addRange(zakres)

        //Kopiowanie tekstu do schowka
        document.execCommand('copy')

        // Zwracanie skopiowanego tekstu (test only)
        return selection.toString()
    }, startTekst, endTekst, dzial)

    if (zaznaczonyTekst === null) {
        throw new Error(`Nie znaleziono tekstu "${startTekst}" lub "${endTekst}" na stronie.`)
    }

    return zaznaczonyTekst
}

module.exports = zaznaczTekstOrazSkopiujDoSchowka
//Funkcja zapisz do txt przy pomocy AutoHotKey:
const sciezkaDoAutoHotKey = require('../../ahk-path')
const { exec } = require('child_process')
const path = require('path')

const wklejTekstDoTxt = async () => {
    return new Promise((resolve, reject) => {
        const sciezkaDoAhk = sciezkaDoAutoHotKey
        const sciezkaDoSkryptuAhk = path.join(__dirname, 'wklej-tekst-do-txt.ahk')
        const sciezkaPlikuTxt = path.join(__dirname, '..', 'file.txt')
        
        exec(`${sciezkaDoAhk} "${sciezkaDoSkryptuAhk}" "${sciezkaPlikuTxt}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Błąd przy uruchamianiu AHK: ${error}`)
                reject(error)
                return
            }
            console.log(`Skrypt AHK wklej-tekst-do-txt zakończony: ${stdout}`)
            resolve(stdout)
        })
    })
}

//Funkcja kopiuj tekst z txt przy pomocy ahk:
const kopiujTekstZTxt = async () => {
    return new Promise((resolve, reject) => {
        const sciezkaDoAhk = sciezkaDoAutoHotKey
        const sciezkaDoSkryptuAhk = path.join(__dirname, 'kopiuj-tekst-z-txt.ahk')
        const sciezkaPlikuTxt = path.join(__dirname, '..', 'file.txt')
       
        
        exec(`${sciezkaDoAhk} "${sciezkaDoSkryptuAhk}" "${sciezkaPlikuTxt}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Błąd przy uruchamianiu AHK: ${error}`)
                reject(error)
                return
            }
            console.log(`Skrypt AHK kopiuj-tekst-z-txt zakończony: ${stdout}`)
            resolve(stdout)
        })
    })
}

//Funkcja wklej do word i zapisz przy pomocy AutoHotKey:
const wklejTekstDoWord = async (nazwaPlikuWord) => {
    return new Promise((resolve, reject) => {
        const sciezkaDoAhk = sciezkaDoAutoHotKey
        const sciezkaDoSkryptuAhk = path.join(__dirname, 'wklej-tekst-do-word.ahk')
        const sciezkaPlikuWord = path.join(__dirname, '..', `${nazwaPlikuWord}.docx`)
        
        exec(`${sciezkaDoAhk} "${sciezkaDoSkryptuAhk}" "${sciezkaPlikuWord}" ${sciezkaPlikuWord}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Błąd przy uruchamianiu AHK: ${error}`)
                reject(error)
                return
            }
            console.log(`Skrypt AHK wklej-tekst-do-word zakończony: ${stdout}`)
            resolve(stdout)
        })
    })
}

//Funkcja usuń plik txt:
const usunTxt = async () => {
    return new Promise((resolve, reject) => {
        const sciezkaDoAhk = sciezkaDoAutoHotKey
        const sciezkaDoSkryptuAhk = path.join(__dirname, 'usun-txt.ahk')
        const sciezkaPlikuTxt = path.join(__dirname, '..', 'file.txt')
       
        
        exec(`${sciezkaDoAhk} "${sciezkaDoSkryptuAhk}" "${sciezkaPlikuTxt}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Błąd przy uruchamianiu AHK: ${error}`)
                reject(error)
                return
            }
            console.log(`Skrypt AHK usun-txt zakończony: ${stdout}`)
            resolve(stdout)
        })
    })
}

module.exports = {
    wklejTekstDoTxt,
    kopiujTekstZTxt,
    wklejTekstDoWord,
    usunTxt
}
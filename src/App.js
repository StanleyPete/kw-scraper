import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {

  const [numerKsiag, setNumerKsiag] = useState('')
  const [aktywanZakladka, setAktywnaZakladka] = useState('zapis-do-pdf')
  const [error, setError] = useState('') 
  

  
  const handleChange = (event) => {
    setNumerKsiag(event.target.value)
    setError('')
  }


  const handleSubmit = (event) => {
    event.preventDefault()

    const wprowadzoneNumery = numerKsiag.split(/[,;\s]+/).map(numer => numer.trim()).filter(numer => numer !== '')

    let listaKsiag = []

    for (const numer of wprowadzoneNumery) {
      const wprowadzonyNumer = numer.split('/')

      if (wprowadzonyNumer.length !== 3) {
        setError('Wprowadź numery w formacie XXXX/XXXXXXXX/X')
        return
      }

      const kodWydzialu = wprowadzonyNumer[0]
      const numerKsiegiWieczystej = wprowadzonyNumer[1]
      const cyfraKontrolna = wprowadzonyNumer[2]

      if (!/^\d{8}$/.test(numerKsiegiWieczystej)) {
        setError('Drugi człon (Numer Księgi Wieczystej) musi być ciągiem składającym się z dokładnie 8 cyfr.');
        return
      }
  
      if (!/^\d{1}$/.test(cyfraKontrolna)) {
        setError('Trzeci człon (Cyfra kontrolna) musi być pojedynczą cyfrą.')
        return
      }

      let nowaKsiega = {
        kodWydzialu,
        numerKsiegiWieczystej,
        cyfraKontrolna,
      }

      listaKsiag.push(nowaKsiega)

      setNumerKsiag('')
    }
    
    handleScrape(listaKsiag)
  }


  


  const handleScrape = async (ksiegi) => {
      
    try {
      const response = await axios.post('http://localhost:5000/scrape', {
        ksiegi
      })

      
      if (response.status === 200) {
        alert(response.data.message)
      } else {
        alert('Błąd: ' + response.data.error)
      }
    } catch (error) {
        console.error('Błąd przy komunikacji z serwerem:', error)
        alert('Wystąpił błąd przy łączeniu z serwerem.')
    }
  }


  const handleTabClick = (nazwaZakladki) => {
    setAktywnaZakladka(nazwaZakladki)
  }


  return (
    <div className="App">
      <div className="warstwa-tla">
        <div className="funkcja">
          <button
          onClick={() => handleTabClick('zapis-do-pdf')}
          className={aktywanZakladka === 'zapis-do-pdf' ? 'active' : ''}
          >
            Zapisz do PDF
          </button>
          <button
          onClick={() => handleTabClick('pobierz-wlascicieli')}
          className={aktywanZakladka === 'pobierz-wlascicieli' ? 'active' : ''}
          >
            Pobierz właścicieli
          </button>
          <button onClick={() => handleTabClick('inna-funkcja')}
            className={aktywanZakladka === 'inna-funkcja' ? 'active' : ''}>
              Inna funkcjonalnosc
          </button>
        </div>
      </div>
      <form className='zapisz-do-pdf' onSubmit={handleSubmit}>
         {/* Dodanie radio buttonów w obrębie formularza */}
         <div className='typ-ksiegi-wieczystej'>
          <label>
            <input
              type="radio"
              value="opcja1"
              name='typKsiegi'
            />
            Aktualna treść KW
          </label>
          <label>
            <input
              type="radio"
              value="opcja2"
              name='typKsiegi'
              defaultChecked
            />
            Zupełna treść KW
          </label>
          <label>
            <input
              type="radio"
              value="opcja3"
              name='typKsiegi'
            />
            Aktualna treść KW - dotychczasowa postać
          </label>
        </div>

        <span>Wpisz numery ksiąg wieczystych:</span>
        <textarea 
           onChange={handleChange}
          placeholder="Wpisz numery ksiąg wieczystych oddzielajac je przecinkiem, średnikiem lub spacją"
          rows="4"
          cols="50" 
        />
        <button type="submit">Zapisz</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  )
}

export default App

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {

  const [error, setError] = useState('') 
  const [numeryKsiag, setNumeryKsiag] = useState('')
  const [aktywanZakladka, setAktywnaZakladka] = useState('zapis-do-pdf')
  // Stany do przechowywania zaznaczonych wartości:
  const [typKsiegi, setTypKsiegi] = useState('zupelna-tresc-kw')
  const [stronyDzialyDoPobrania, setStronyDzialyDoPobrania] = useState({
    'okladka': true,
    'dzial-i-o': true,
    'dzial-i-sp': true,
    'dzial-ii': true,
    'dzial-iii': true,
    'dzial-iv': true,
  })
  
  
  const handleZmianaTextArea = (event) => {
    setNumeryKsiag(event.target.value)
    setError('')
  }


  const handleTypKsiegi = (event) => {
    setTypKsiegi(event.target.value)
  }


  const handleStronyDzialyDoPobrania = (event) => {
    const { name, checked } = event.target
    setStronyDzialyDoPobrania((prevState) => ({
      ...prevState,
      [name]: checked,
    }))
  }


  const handleWysylkaFormularza = (event) => {
    event.preventDefault()

    //Sprawdzenie czy textarea jest pusty:
    if (!numeryKsiag.trim()) {
      setError('Musisz wpisac numery ksiąg wieczystych!')
      return
    }

    //Sprawdzenie czy jest zaznaczona przynajmniej jedna strona/dział do pobrania
    const przynajmniejJednaStronaZaznaczona = Object.values(stronyDzialyDoPobrania).some(value => value)

    if (!przynajmniejJednaStronaZaznaczona) {
      setError('Musisz wybrać przynajmniej jeden dział lub stronę do pobrania.');
      return
    }

    //Sprawdzanie poprawności numerów ksiąg:
    const wprowadzoneNumery = numeryKsiag.split(/[,;\s]+/).map(numer => numer.trim()).filter(numer => numer !== '')

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

        setNumeryKsiag('')
    }
    
    handleScrape(listaKsiag, typKsiegi, stronyDzialyDoPobrania)
  }

  //Funkcja przekazująca wartości do backendu
  const handleScrape = async (ksiegi, typKsiegi, stronyDzialyDoPobrania) => {
      
    try {
      const response = await axios.post('http://localhost:5000/scrape', {
        ksiegi,
        typKsiegi,
        stronyDzialyDoPobrania,
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

      {/* Zakładki:*/}
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


      {/* Główny formularz:*/}
      <form className='zapisz-do-pdf' onSubmit={handleWysylkaFormularza}>

         {/* Typ księgi wieczystej*/}
         <div className='typ-ksiegi-wieczystej'>
            <p>Zaznacz typ księgi wieczystej:</p>
            {[
              { value: 'aktualna-tresc-kw', label: 'Aktualna treść KW' },
              { value: 'zupelna-tresc-kw', label: 'Zupełna treść KW' },
              { value: 'aktualna-tresc-kw-dotychczasowa-postac', label: 'Aktualna treść KW - dotychczasowa postać' },
            ].map(({ value, label }) => (
              <label key={value}>
                <input
                  type="radio"
                  value={value}
                  name='typKsiegi'
                  checked={typKsiegi === value}
                  onChange={handleTypKsiegi}
                />
                {label}
              </label>
            ))}
        </div>

        {/* Strony/działy do pobrania*/}
        <div className="strony-dzialy-do-pobrania">
            <p>Zaznacz strony/działy do pobrania:</p>
            {[
              { value: 'okladka', label: 'Okładka' },
              { value: 'dzial-i-o', label: 'Dział I-O' },
              { value: 'dzial-i-sp', label: 'Dział I-Sp' },
              { value: 'dzial-ii', label: 'Dział II' },
              { value: 'dzial-iii', label: 'Dział III' },
              { value: 'dzial-iv', label: 'Dział IV' }
            ].map(({ value, label }) => (
              <label key={value}>
                <input
                  type="checkbox"
                  value={value}
                  name={value}
                  checked={stronyDzialyDoPobrania[value]}
                  onChange={handleStronyDzialyDoPobrania}
                />
                {label}
              </label>
            ))}
        </div>


        {/*Textarea*/}
        <div className="textarea-input">
            <p>Wpisz numery ksiąg wieczystych:</p>
            <textarea 
              onChange={handleZmianaTextArea}
              placeholder="Wpisz numery ksiąg wieczystych oddzielajac je przecinkiem, średnikiem lub spacją"
              rows="4"
              cols="50" 
            />
            <button type="submit">Zapisz</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>


      </form>
    </div>
  )
}

export default App

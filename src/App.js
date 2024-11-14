import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {

  const [error, setError] = useState('') 
  const [numeryKsiag, setNumeryKsiag] = useState('')
  const [aktywanZakladka, setAktywnaZakladka] = useState('zapis-do-pdf')
  // Stany do przechowywania zaznaczonych wartości:
  const [typKsiegi, setTypKsiegi] = useState('Aktualna treść KW')
  const [stronyDzialyDoPobrania, setStronyDzialyDoPobrania] = useState({
    'Okładka': true,
    'Dział I-O': true,
    'Dział I-Sp': true,
    'Dział II': true,
    'Dział III': true,
    'Dział IV': true,
  })

  const typyKsiegi = [
    'Aktualna treść KW',
    'Zupełna treść KW',
    'Aktualna treść KW - dotychczasowa postać',
  ]
  
  
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
    
      const wybraneStronyDzialy = Object.entries(stronyDzialyDoPobrania)
        .filter(([key, value]) => value) 
        .map(([key]) => key);


      const response = await axios.post('http://localhost:5000/scrape', {
        ksiegi,
        typKsiegi,
        stronyDzialyDoPobrania: wybraneStronyDzialy
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

  useEffect(() => {
    if (typKsiegi === 'Aktualna treść KW') {
      setStronyDzialyDoPobrania((prevState) => ({
        ...prevState,
        Okładka: false,
      }));
    }
  }, [typKsiegi]);

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
            <span>( Ta wersja działa TYLKO dla: Aktualna treść KW !!! )</span>
            {typyKsiegi.map((label, index) => (
              <label key={index}>
                <input
                  type="radio"
                  value={label}
                  name="typKsiegi"
                  checked={typKsiegi === label} 
                  // onChange={handleTypKsiegi}
                />
                {label}
              </label>
            ))}
        </div>

        {/* Strony/działy do pobrania*/}
        <div className="strony-dzialy-do-pobrania">
            <p>Zaznacz strony/działy do pobrania:</p>
            {Object.keys(stronyDzialyDoPobrania)
            .filter((key) => typKsiegi !== 'Aktualna treść KW' || key !== 'Okładka')
            .map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  value={key}
                  name={key}
                  checked={stronyDzialyDoPobrania[key]} 
                  onChange={handleStronyDzialyDoPobrania}
                />
                {key} {/* Klucz stanu użyty jako etykieta */}
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

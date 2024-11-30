import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ErrorPopUp from './components/ErrorPopUp'
import './App.css'

function App() {

  const [error, setError] = useState({error: false, errorTekst: ''}) 
  const [numeryKsiag, setNumeryKsiag] = useState('')
  const [typKsiegi, setTypKsiegi] = useState('Aktualna treść KW')
  const [stronyDzialyDoPobrania, setStronyDzialyDoPobrania] = useState({
    'Okładka': true,
    'Dział I-O': true,
    'Dział I-Sp': true,
    'Dział II': true,
    'Dział III': true,
    'Dział IV': true,
  })
  const [opcjeZapisu, setOpcjeZapisu] = useState({
    'PDF': true,
    'DOCX': true,
    'TXT': true,
  })
  const [pozostawOtwartaPrzegladarke, setPozostawOtwartaPrzegladarke] = useState(false)

  const typyKsiegi = [
    'Aktualna treść KW',
    'Zupełna treść KW',
    'Aktualna treść KW - dotychczasowa postać',
  ]  
  
  const handleZmianaTextArea = (event) => {
    setNumeryKsiag(event.target.value)
    setError({error: false, errorTekst: ''})
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

  const handleOpcjeZapisu = (event) => {
    const { name, checked } = event.target
    setOpcjeZapisu((prevState) => ({
      ...prevState,
      [name]: checked,
    }))
  }

  const handlePozostawOtwartaPrzegladarke = () => {
    setPozostawOtwartaPrzegladarke(prevState => !prevState)
  }

  const sprawdzCzyTextareaPusty = () => {
    if (!numeryKsiag.trim()) {
      setError({
          error: true,
          errorTekst: typKsiegi === 'Aktualna treść KW' 
              ? 'Musisz wpisać numer księgi wieczystej!' 
              : 'Musisz wpisać numer/numery ksiąg wieczystych!'
      })
      return true
    }

    return false
  }

  const sprawdzCzyWybranoStronyIOpcje = () => {
    const przynajmniejJednaStronaZaznaczona = Object.values(stronyDzialyDoPobrania).some(value => value)
    const przynajmniejJednaZaznaczonaOpcjaZapisu = Object.values(opcjeZapisu).some(value => value)

    if (!przynajmniejJednaStronaZaznaczona && przynajmniejJednaZaznaczonaOpcjaZapisu) {
        setError({ error: true, errorTekst: 'Musisz wybrać dział i opcje zapisu!' })
        return true
    }

    if (!przynajmniejJednaStronaZaznaczona) {
        setError({ error: true, errorTekst: 'Musisz wybrać przynajmniej jeden dział lub stronę do pobrania.' })
        return true
    }

    if (!przynajmniejJednaZaznaczonaOpcjaZapisu) {
        setError({ error: true, errorTekst: 'Musisz wybrać opcje zapisu!' });
        return true
    }

    return false
  }

  const pobierzNumeryKsiegi = () => {
    return numeryKsiag.split(/[,;\s]+/)
        .map(numer => numer.trim())
        .filter(numer => numer !== '')
  }

  const sprawdzPoprawnoscNumerow = (wprowadzoneNumery) => {

    if (typKsiegi === 'Aktualna treść KW' && wprowadzoneNumery.length > 1) {
      setError({ error: true, errorTekst: 'Możesz wprowadzić TYLKO JEDEN NUMER KSIĘGI' })
      return false
    }

    let listaKsiag = []

    for (const numer of wprowadzoneNumery) {
        const [kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna] = numer.split('/')

        if (!kodWydzialu || !numerKsiegiWieczystej || !cyfraKontrolna) {
            setError({ 
              error: true, 
              errorTekst: 'Wprowadź numery w formacie XXXX/XXXXXXXX/X' 
            })
            return false
        }

        if (!/^\d{8}$/.test(numerKsiegiWieczystej)) {
            setError({ 
              error: true, 
              errorTekst: 'Drugi człon (Numer Księgi Wieczystej) musi być ciągiem składającym się z dokładnie 8 cyfr.'
            })
            return false
        }

        if (!/^\d{1}$/.test(cyfraKontrolna)) {
            setError({
              error: true, 
              errorTekst: 'Trzeci człon (Cyfra kontrolna) musi być pojedynczą cyfrą.'
            })
            return false;
        }

        listaKsiag.push({ kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna })
    }

    return listaKsiag
  }

  const handleWysylkaFormularza = (event) => {
    event.preventDefault() 

    if (sprawdzCzyTextareaPusty()) return
    if (sprawdzCzyWybranoStronyIOpcje()) return
  
    const wprowadzoneNumery = pobierzNumeryKsiegi()
    if (!sprawdzPoprawnoscNumerow(wprowadzoneNumery)) return

    handleScrape(wprowadzoneNumery, typKsiegi, stronyDzialyDoPobrania)
  }

 
  const handleScrape = async (ksiegi, typKsiegi, stronyDzialyDoPobrania) => {
      
    try {
      const wybraneStronyDzialy = Object.entries(stronyDzialyDoPobrania)
        .filter(([key, value]) => value) 
        .map(([key]) => key)

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

  useEffect(() => {
    if (typKsiegi === 'Aktualna treść KW') {
      setStronyDzialyDoPobrania((prevState) => ({
        ...prevState,
        Okładka: false,
      }))
    }
  }, [typKsiegi])

  return (
    <div className="App">

      <h1>KW scraper</h1>

      {/* Główny formularz:*/}
      <form className='zapisz-do-pdf' onSubmit={handleWysylkaFormularza}>

         {/* Typ księgi wieczystej*/}
         <div className='typ-ksiegi-wieczystej'>
            <p>Zaznacz typ księgi wieczystej:</p> 
            {typyKsiegi.map((label, index) => (
              <label key={index}>
                <input
                  type="radio"
                  value={label}
                  name="typKsiegi"
                  checked={typKsiegi === label} 
                  onChange={handleTypKsiegi}
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
                  {key} 
              </label>
            ))}
        </div>

        {/* Zapis do jakiego formatu...*/}
        <div className="zapis-do">
          <p>Zapis do:</p>
          {Object.keys(opcjeZapisu)
            .filter((key) => {
              if (typKsiegi === 'Zupełna treść KW' || typKsiegi === 'Aktualna treść KW - dotychczasowa postać') {
                return key === 'PDF'
              }
                return true
              })
            .map((key) => (
              <label key={key}>
                <input
                  type="checkbox"
                  value={key}
                  name={key}
                  checked={opcjeZapisu[key]} 
                  onChange={handleOpcjeZapisu}
                />
                  {key}
              </label>
            ))}
        </div>
     
        {/*Textarea*/}
        <div className="textarea-input">
            <p>{typKsiegi === 'Aktualna treść KW' ? 'Wpisz TYLKO JEDEN numer księgi:' : 'Wpisz numery ksiąg wieczystych:'}</p>
            <textarea 
              onChange={handleZmianaTextArea}
              placeholder="Wpisz numery ksiąg wieczystych oddzielajac je przecinkiem, średnikiem lub spacją"
              rows="4"
              cols="50" 
            />
            <button type="submit">Zapisz</button>
            <label htmlFor="pozostawOtwartaPrzegladarke" className="pozostaw-otwarta-przegladarke">
              <input
                type="checkbox"
                id="pozostawOtwartaPrzegladarke"
                checked={pozostawOtwartaPrzegladarke} // Domyślnie false
                onChange={handlePozostawOtwartaPrzegladarke}
              />
                Pozostaw otwartą przegladarkę
              </label>
              <ErrorPopUp error={error} setError={setError} />
        </div>
          
         {/*Przycisk zamknij (position: absolute*/}
        <button className="zamknij">Zamknij</button>

      </form>
    </div>
  )
}

export default App

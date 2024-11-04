import React, { useState, useEffect } from 'react'
import './App.css'

function App() {

  const [numerKsiag, setNumerKsiag] = useState('')
  const [error, setError] = useState('') 
  const [listaKsiag, setListaKsiag] = useState([])

  
  const handleChange = (event) => {
    setNumerKsiag(event.target.value)
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const wprowadzoneNumery = numerKsiag.split(/[,;\s]+/).map(numer => numer.trim()).filter(numer => numer !== '')

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

      const nowyNumer = {
        kodWydzialu,
        numerKsiegiWieczystej,
        cyfraKontrolna,
      }

      setListaKsiag((prevList) => [...prevList, nowyNumer])

      setNumerKsiag('')
    }

    
  }

  useEffect(() => {
    console.log('Aktualna lista ksiąg:', listaKsiag)
  }, [listaKsiag])

  return (
    <div className="App">
      <div className="mode">
        <button>Zapisz do PDF</button>
        <button>Inna funkcjonalnosc</button>
        <button>Inna funkcjonalnosc</button>
      </div>
      <form className='zapisz-do-pdf' onSubmit={handleSubmit}>
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

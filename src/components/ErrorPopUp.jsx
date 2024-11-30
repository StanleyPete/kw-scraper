import React from 'react'

const ErrorPopUp = ({error, setError}) => {

    const zamknijError = () => {
       setError({ error: false, errorTekst: '' }) 
    }
 
    return (
       error.error && (
          <div className="nakladka">
             <div className="error">
                <div className="error-content">
                   <p>{error.errorTekst}</p>
                   <button onClick={zamknijError}>OK</button>
                </div>
             </div>
          </div>
       )
    )
 }
 
 export default ErrorPopUp
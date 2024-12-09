import React, { useState } from 'react';
import kodyWydzialoweSadow from '../helpers/kodyWydzialoweSadow.json';
import obliczCyfreKontrolna from '../helpers/obliczCyfreKontrolna';
import axios from 'axios';

const PobierzDaneOLokalach = () => {
    const [error, setError] = useState('');
    const [numerKsiegi, setNumerKsiegi] = useState('');
    const [uzyjTor, setUzyjTor] = useState(false);

    const handleZmianaTextArea = (event) => {
        setNumerKsiegi(event.target.value);
        setError('');
    };

    const handleUzyjTor = () => {
        setUzyjTor(prevState => !prevState);
    };

   
    const handleWysylkaFormularza = async (event) => {
        event.preventDefault();

        if (!numerKsiegi.trim()) {
            setError('Musisz wpisac numery ksiąg wieczystych!');
            return;
        }

        const czesciNumeruKsiegi = numerKsiegi.trim().split('/'); 
        if (czesciNumeruKsiegi.length !== 3) {
            setError('Numer księgi musi być w formacie XXXX/XXXXXXXX/X');
            return;
        }

        czesciNumeruKsiegi.forEach((part, index) => {
            czesciNumeruKsiegi[index] = part.replace(/\s+/g, ''); 
        });

        const [kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna] = czesciNumeruKsiegi;

        //Sprawdzenie poprawności kodu wydziałowego sądu (pierwsza części wprowadzonego numeru)
        if (!kodyWydzialoweSadow.includes(kodWydzialu)) {
            setError(`Kod wydziału "${kodWydzialu}" jest nieprawidłowy.`);
            return;
        }

        //Sprawdzenie poprawności numeru księgi wieczystej (druga częśc wprowadzonego numeru)
        if (!/^\d{8}$/.test(numerKsiegiWieczystej)) {
            setError(`Druga część ("${numerKsiegiWieczystej}") musi składać się dokładnie z 8 cyfr.`);
            return;
        }

        //Sprawdzenie czy cyfra kontrolna jest cyfrą (trzecia częśc wprowadzonego numeru)
        if (!/^\d$/.test(cyfraKontrolna)) {
            setError(`Trzecia część ("${cyfraKontrolna}") musi być pojedynczą cyfrą.`);
            return;
        }

        //Sprawdzenie poprawności cyfry kontrolnej
        const numerKsiegiPodSprawdzenieCyfryKontrolnej = (kodWydzialu + numerKsiegiWieczystej).toString();

        console.log(numerKsiegiPodSprawdzenieCyfryKontrolnej);

        const obliczonaCyfraKontrolna = obliczCyfreKontrolna(numerKsiegiPodSprawdzenieCyfryKontrolnej);
        console.log(obliczCyfreKontrolna);

        if(obliczonaCyfraKontrolna !== Number(cyfraKontrolna)){
            setError(`Niepoprawna cyfra kontrolna`);
            return;
        }

        handlePobierzWlascicieli(kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna, uzyjTor);

    };

    const handlePobierzWlascicieli = async (kodWydzialu, numerKsiegiWieczystej, cyfraKontrolna, uzyjTor) => {
        try {
            const obiektNumeruKsiegi = {
                kodWydzialu,
                numerKsiegiWieczystej,
                cyfraKontrolna
            };
            
            const response = await axios.post('http://localhost:5000/pobierz-dane-o-lokalach', {
                numerKsiegi: obiektNumeruKsiegi,
                uzyjTor
            });

            if (response.status === 200) {
                alert(response.data.message);
            } else {
                alert('Błąd: ' + response.data.error);
            }
        } catch (error) {
            console.error('Błąd przy komunikacji z serwerem:', error);
            alert('Wystąpił błąd przy łączeniu z serwerem.');
        }
    };


    return (
        <form className='pobierz-wlascicieli' onSubmit={handleWysylkaFormularza}>
           
            <div className="textarea-input">
                <p>Wpisz numer księgi wieczystej:</p>
                <textarea
                    onChange={handleZmianaTextArea}
                    placeholder="Wpisz TYLKO JEDEN numer księgi wieczystej"
                    rows="4"
                    cols="50"
                />
                <button type="submit">Pobierz dane o lokalach</button>
                <label htmlFor="uzyjTor" className="uzyj-tor">
                    <input
                        type="checkbox"
                        id="uzyjTor"
                        checked={uzyjTor} // Domyślnie false
                        onChange={handleUzyjTor}
                    />
                        Użyj TOR 
                </label>
                <p className={`tor-hint ${uzyjTor ? 'tor-hint-active' : ''}`}>*Aby używać TOR musisz mieć go zainstalowanego lokalnie na swoim komputerze</p>
                <p className={`tor-hint ${uzyjTor ? 'tor-hint-active' : ''}`}>*Przed kliknięciem Zapisz, uruchom TOR i nawiąż połączenie</p>
                {error && <div style={{ color: 'red' }}>{error}</div>}
            </div>
        </form>
    );
};

export default PobierzDaneOLokalach;

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ZapiszDoPdf = () => {
    const [error, setError] = useState('');
    const [numeryKsiag, setNumeryKsiag] = useState('');
    const [typKsiegi, setTypKsiegi] = useState('Aktualna treść KW');
    const [uzyjTor, setUzyjTor] = useState(false);
    const [stronyDzialyDoPobrania, setStronyDzialyDoPobrania] = useState({
        Okładka: true,
        'Dział I-O': true,
        'Dział I-Sp': true,
        'Dział II': true,
        'Dział III': true,
        'Dział IV': true,
    });

    const typyKsiegi = useMemo(() => [
        'Aktualna treść KW',
        'Zupełna treść KW',
        'Aktualna treść KW - dotychczasowa postać',
    ], []);


    const handleZmianaTextArea = (event) => {
        setNumeryKsiag(event.target.value);
        setError('');
    };

    const handleTypKsiegi = (event) => {
        setTypKsiegi(event.target.value);
    };

    const handleStronyDzialyDoPobrania = (event) => {
        const { name, checked } = event.target;
        setStronyDzialyDoPobrania((prevState) => ({
            ...prevState,
            [name]: checked,
        }));
    };

    const handleUzyjTor = () => {
        setUzyjTor(prevState => !prevState);
    };

    const handleWysylkaFormularza = async (event) => {
        event.preventDefault();

        if (!numeryKsiag.trim()) {
            setError('Musisz wpisac numery ksiąg wieczystych!');
            return;
        }

        const przynajmniejJednaStronaZaznaczona = Object.values(stronyDzialyDoPobrania).some((value) => value);

        if (!przynajmniejJednaStronaZaznaczona) {
            setError('Musisz wybrać przynajmniej jeden dział lub stronę do pobrania.');
            return;
        }

        const wprowadzoneNumery = numeryKsiag
            .split(/[,;\s]+/)
            .map((numer) => numer.trim())
            .filter((numer) => numer !== '');

        let listaKsiag = [];

        for (const numer of wprowadzoneNumery) {
            const wprowadzonyNumer = numer.split('/');

            if (wprowadzonyNumer.length !== 3) {
                setError('Wprowadź numery w formacie XXXX/XXXXXXXX/X');
                return;
            }

            const kodWydzialu = wprowadzonyNumer[0];
            const numerKsiegiWieczystej = wprowadzonyNumer[1];
            const cyfraKontrolna = wprowadzonyNumer[2];

            if (!/^\d{8}$/.test(numerKsiegiWieczystej)) {
                setError(
                    'Drugi człon (Numer Księgi Wieczystej) musi być ciągiem składającym się z dokładnie 8 cyfr.'
                );
                return;
            }

            if (!/^\d{1}$/.test(cyfraKontrolna)) {
                setError('Trzeci człon (Cyfra kontrolna) musi być pojedynczą cyfrą.');
                return;
            }

            listaKsiag.push({
                kodWydzialu,
                numerKsiegiWieczystej,
                cyfraKontrolna,
            });
        }

        handleZapisDoPdf(listaKsiag, typKsiegi, stronyDzialyDoPobrania, uzyjTor);
    };


    const handleZapisDoPdf = async (ksiegi, typKsiegi, stronyDzialyDoPobrania, uzyjTor) => {
        try {
            const wybraneStronyDzialy = Object.entries(stronyDzialyDoPobrania)
                .filter(([key, value]) => value)
                .map(([key]) => key);

            const response = await axios.post('http://localhost:5000/zapis-pdf', {
                ksiegi,
                typKsiegi,
                stronyDzialyDoPobrania: wybraneStronyDzialy,
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

    useEffect(() => {
        if (typKsiegi === 'Aktualna treść KW') {
            setStronyDzialyDoPobrania((prevState) => ({
                ...prevState,
                Okładka: false,
            }));
        }
    }, [typKsiegi]);

    return (
        <form className="zapisz-do-pdf" onSubmit={handleWysylkaFormularza}>
            {/* Typ księgi wieczystej */}
            <div className="typ-ksiegi-wieczystej">
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

            {/* Strony/działy do pobrania */}
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

            {/* Textarea */}
            <div className="textarea-input">
                <p>Wpisz numery ksiąg wieczystych:</p>
                <textarea
                    onChange={handleZmianaTextArea}
                    placeholder="Wpisz numery ksiąg wieczystych oddzielajac je przecinkiem, średnikiem lub spacją"
                    rows="4"
                    cols="50"
                />
                <button type="submit">Zapisz</button>
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

export default ZapiszDoPdf;

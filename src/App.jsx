import React, { useState } from 'react';
import ZapiszDoPdf from './components/ZapiszDoPdf';
import PobierzDaneOLokalach from './components/PobierzDaneOLokalach';
import InnaFunkcjonalnosc from './components/InnaFunkcjonalnosc';
import './App.css';

function App() {
    //Stan do przechowywania aktualnej zakładki
    const [aktywanZakladka, setAktywnaZakladka] = useState('zapis-do-pdf');

    //Zakładki
    const zakladki = [
        {
            nazwa: 'zapis-do-pdf',
            etykieta: 'Zapisz do PDF',
            komponent: <ZapiszDoPdf />,
        },
        {
            nazwa: 'pobierz-dane-o-lokalach',
            etykieta: 'Pobierz dane o lokalach',
            komponent: <PobierzDaneOLokalach />,
        },
        {
            nazwa: 'inna-funkcja',
            etykieta: 'Inna funkcjonalność',
            komponent: <InnaFunkcjonalnosc />,
        },
    ];

    return (
        <div className="App">
            {/* Zakładki */}
            <div className="warstwa-tla">
                <div className="zakladki">
                    {zakladki.map((zakladka) => (
                        <button
                            key={zakladka.nazwa}
                            onClick={() => setAktywnaZakladka(zakladka.nazwa)}
                            className={aktywanZakladka === zakladka.nazwa ? 'active' : ''}
                        >
                            {zakladka.etykieta}
                        </button>
                    ))}
                </div>
            </div>

            {/* Wyświetlanie komponentu */}
            <div className="content">
                {zakladki.find((zakladka) => zakladka.nazwa === aktywanZakladka)?.komponent}
            </div>
        </div>
    );
}

export default App;

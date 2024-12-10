const XLSX = require('xlsx');
const path = require('path');

const zapiszPlikExcel = (dane, numerKsiegiWieczystej) => {
    const naglowki = [
        'Numer Księgi Wieczystej',
        'Ulica',
        'Numer Budynku',
        'Numer Lokalu',
        'Powierzchnia lokalu',
        'Udział'
    ];

    const wiersze = dane.map(obj => [
        obj.numerKsiegiWieczystej,
        obj.ulica,
        obj.numerBudynku,
        obj.numerLokalu,
        obj.powierzchnia,
        obj.udzial
    ]);
  
    const arkuszRoboczy = XLSX.utils.aoa_to_sheet([naglowki, ...wiersze]);
  
    const arkuszDocelowy = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(arkuszDocelowy, arkuszRoboczy, 'Dane');
    
    const folderDocelowy = path.join(__dirname, '..', '..'); 

    const sciezkaPliku = path.join(folderDocelowy, `${numerKsiegiWieczystej}.xlsx`);

    XLSX.writeFile(arkuszDocelowy, sciezkaPliku);
};

module.exports = zapiszPlikExcel;
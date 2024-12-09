const obliczCyfreKontrolna = (numer) => {

    const znakWartosc = {
        '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
        '6': 6, '7': 7, '8': 8, '9': 9, 'X': 10, 'A': 11,
        'B': 12, 'C': 13, 'D': 14, 'E': 15, 'F': 16, 'G': 17,
        'H': 18, 'I': 19, 'J': 20, 'K': 21, 'L': 22, 'M': 23,
        'N': 24, 'O': 25, 'P': 26, 'R': 27, 'S': 28, 'T': 29,
        'U': 30, 'W': 31, 'Y': 32, 'Z': 33
    };

    const znakMnoznik = {
        1: 1, 2: 3, 3: 7, 4: 1, 5: 3, 6: 7,
        7: 1, 8: 3, 9: 7, 10: 1, 11: 3, 12: 7
    };

    let suma = 0;

    for (let i = 0; i < numer.length; i++) {
        const znak = numer[i];
        const wartosc = znakWartosc[znak];
        const mnoznik = znakMnoznik[i + 1];
        suma += wartosc * mnoznik;
    }
    return suma % 10;
};

export default obliczCyfreKontrolna;
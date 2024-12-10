const posortujLokale = (dane) => {
    return dane.sort((a, b) => {
        const sortujUlice = a.ulica.localeCompare(b.ulica);
        if (sortujUlice !== 0) return sortujUlice;

        const sortujBudynki = a.numerBudynku.localeCompare(b.numerBudynku);
        if (sortujBudynki !== 0) return sortujBudynki;

        const sortujLokale = parseInt(a.numerLokalu, 10) - parseInt(b.numerLokalu, 10);
        return sortujLokale;
    });
};

module.exports = posortujLokale;
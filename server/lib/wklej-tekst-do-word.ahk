; Pobierz ścieżkę do pliku z argumentu
filePathWord := A_Args[1]

; Otwórz plik 
Run, %filePathWord%

; Pauza
Sleep, 1000

; Zaznacz cały tekst
Send, ^a

; Pauza
Sleep, 500

; Przejdź na koniec dokumentu
Send, {End}

; Pauza
Sleep, 500

; Nowy wiersz
Send, {Enter}

; Pauza
Sleep, 500

; Wklej tekst
Send, ^v

; Pauza
Sleep, 500 

; Zapisz plik
Send, ^s

; Pauza
Sleep, 500

; Zamknij Word
Send, !{F4}

; Pauza
Sleep, 500
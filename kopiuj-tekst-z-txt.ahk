; Pobierz ścieżkę do pliku z argumentu
filePath := A_Args[1]

; Otwórz plik 
Run, %filePath%

; Pauza
Sleep, 500

; Zaznacz cały tekst
Send, ^a

; Pauza
Sleep, 1000 

; Skopiuj tekst do schowka
Send, ^c

; Pauza
Sleep, 1000

; Zamknij Notatnik
Send, !{F4}

; Pauza
Sleep, 500
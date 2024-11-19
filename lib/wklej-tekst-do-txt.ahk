; Pobierz ścieżkę do pliku z argumentu
filePath := A_Args[1]

; Sprawdź, czy plik istnieje
IfNotExist, %filePath%
{
    ; Utwórz plik
    FileAppend, , %filePath%

    ; Otwórz plik
    Run, %filePath%

    ; Pauza
    Sleep, 500

    ; Wklej zawartość schowka
    Send, ^v

    ; Pauza
    Sleep, 500

    ; Zapisz plik
    Send, ^s

    ; Pauza
    Sleep, 500

    ; Zamknij Notatnik
    Send, !{F4}

    ; Pauza
    Sleep, 500
}
else
{
    ; Otwórz plik (jeśli istnieje)
    Run, %filePath%

    ; Pauza
    Sleep, 500

    ; Przejdź na koniec dokumentu
    Send, ^{End}

    ; Pauza
    Sleep, 500

    ; Nowy wiersz
    Send, {Enter}

    ; Pauza
    Sleep, 500

    ; Wklej zawartość schowka 
    Send, ^v

    ; Pauza
    Sleep, 500

    ; Zapisz plik
    Send, ^s

    ; Pauza
    Sleep, 500

    ; Zamknij Notatnik
    Send, !{F4}
}

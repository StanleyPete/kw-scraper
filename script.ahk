; Pobierz ścieżkę do pliku z argumentu
filePath := A_Args[1]

; Sprawdź, czy plik istnieje
IfNotExist, %filePath%
{
    ; Jeśli plik nie istnieje, utwórz go (ale bez żadnych danych)
    FileAppend, , %filePath%

    ; Otwórz plik w domyślnym edytorze tekstu (Notatnik)
    Run, %filePath%

    ; Poczekaj chwilę, aby plik został otwarty
    Sleep, 500

    ; Wklej zawartość schowka do pliku
    Send, ^v

    ; Poczekaj chwilę, aby zawartość została wklejona
    Sleep, 500

    ; Zapisz plik
    Send, ^s

    ; Zamknij Notatnik
    Send, !{F4}
}
else
{
    ; Jeśli plik już istnieje, otwórz go
    Run, %filePath%

    ; Poczekaj chwilę, aby plik został otwarty
    Sleep, 500

    ; Wklej zawartość schowka do pliku
    Send, ^v

    ; Poczekaj chwilę, aby zawartość została wklejona
    Sleep, 500

    ; Zapisz plik
    Send, ^s

    ; Zamknij Notatnik
    Send, !{F4}
}

#NoEnv  
#Persistent 
#SingleInstance Force 


CloseCmdWindows() {
    
    WinGet, id, List, ahk_class ConsoleWindowClass
    Loop, %id%
    {
        this_id := id%A_Index%
        WinClose, ahk_id %this_id%
    }
}


KillNodeProcesses() {
    RunWait, taskkill /F /IM node.exe, , Hide
}


CloseCmdWindows()
KillNodeProcesses()


ExitApp
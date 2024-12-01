#NoEnv  
#Persistent  
#SingleInstance Force  

Send, ^w 

CloseCmdWindows() {
    Process, Wait, OpenConsole.exe 
    Loop {
        Process, Close, OpenConsole.exe
      OpenConsole.exe
        if !ProcessExist("OpenConsole.exe")
            break
    }
}

KillNodeProcesses() {
    RunWait, taskkill /F /IM node.exe, , Hide
}

ProcessExist(ProcessName) {
    Process, Exist, %ProcessName%
    return ErrorLevel
}

CloseCmdWindows()
KillNodeProcesses()
ExitApp

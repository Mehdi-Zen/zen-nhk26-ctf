Print "---Reverse Challenge---"
Print "Auteur: Kisane"

Print
Input "Nom d'utilisateur : ", u$
Input "Mot de passe : ", p$

s$ = ""
s$ = s$ + Chr$(54 - 3): s$ = s$ + Chr$(25 * 2): s$ = s$ + Chr$(40 + 9) ' 321
s$ = s$ + Chr$(45) ' -
s$ = s$ + Chr$(134 / 2): s$ = s$ + Chr$(201 / 3): s$ = s$ + Chr$(73) ' CCI

' chiffrement de cesar
u_cesar$ = ""
For i = 1 To Len(u$)
    u_cesar$ = u_cesar$ + Chr$(Asc(Mid$(u$, i, 1)) + 1)
Next i

answer$ = u_cesar$ + s$

If p$ = answer$ And Len(p$) > 0 Then
    Print
    Print "Acces Autorise ! Generation du Flag..."
    _Delay 0.5
    Print
    ' --- FLAG ASCII ART VERTICAL OBFUSQUE ---
    _Delay 1

    Print "       " + "__  _" + "_    _" + "_      " + "           " + "        "
    Print "      /" + "  |/ " + " |  /" + "  |   " + "           " + "        "
    Print "  ____" + "$$ |$" + "$ |  " + "$$ |  " + "           " + "        "
    Print " /    " + "$$ |$" + "$ |__" + "$$ |  " + "           " + "        "
    Print "/$$$$$" + "$$ |$" + "$    " + "$$ |  " + "           " + "        "
    Print "$$ |  " + "$$ |$" + "$$$$" + "$$$$ " + "|     " + "           " + "        "
    Print "$$ \__" + "$$ | " + "     " + "$$ |  " + "           " + "        "
    Print "$$    " + "$$ | " + "     " + "$$ |  " + "           " + "        "
    Print " $$$$$" + "$$/  " + "     " + "$$/   " + "           " + "        "
    Print "      " + "     " + "     " + "      " + "           " + "        "
    Print "  ____" + "__   " + " ____" + "__   " + "      " + "__  __" + "______  " + "    "
    Print " /    " + "  \  " + "/    " + "  \  " + "     " + "/  |/" + "       " + " |   "
    Print "/$$$$$" + "$  |/" + "$$$$$" + "$  | " + " ____" + "$$ |$" + "$$$$$$" + "$$/ " + "____ "
    Print "$$ |  " + "$$/ " + "$$$  " + "\$$ |" + " /   " + " $$ |" + "$$ |__ " + "  /  " + "  | "
    Print "$$ |  " + "    " + " $$$$" + "  $$" + " |/$$" + "$$$$$" + "$ |$$" + "    | " + " $$$$" + "/ "
    Print "$$ |  " + " __ " + "$$ $" + "$ $$" + " |$$ " + "|  $$" + " |$$$" + "$$/  " + " /   " + "  | "
    Print "$$ \__" + "/  |" + "$$ \" + "$$$$" + " |$$" + " \__$" + "$ |$$" + " |____" + "_$$$$" + "/ "
    Print "$$    " + "$$/ " + "$$   " + "$$$/" + " $$  " + "  $$" + " |$$   " + "    | " + "     "
    Print " $$$$$" + "$/   " + "$$$$$" + "$/   " + "$$$$$" + "$$/ " + "$$$$$$" + "$$/  " + "     "
    Print
Else
    Print
    Print "Mauvaise reponse... :-("
End If


#!/usr/bin/env python3
"""
trinity_sequence.py
Séquence d'autorisation, Terminal de Sécurité Los Alamos
7 étapes chronomètrées. Questions et codes dynamiques à chaque session.
Toute erreur ou timeout déclenche le verrouillage d'urgence.
"""

import sys
import os
import time
import threading
import select
import random
import string

# ── Couleurs ANSI ──────────────────────────────────────────────────────────────
RED    = '\033[91m'
GREEN  = '\033[92m'
YELLOW = '\033[93m'
CYAN   = '\033[96m'
WHITE  = '\033[97m'
BOLD   = '\033[1m'
DIM    = '\033[2m'
RESET  = '\033[0m'

TOTAL_STEPS = 7

# ── Codes dynamiques générés UNE FOIS par session ─────────────────────────────
ACTIVATION_CODE = f"TRINITY-{random.randint(1000, 9999)}"
AMORÇAGE_SEQ    = "-".join(str(random.randint(0, 9)) for _ in range(6))
GADGET_CODE     = f"GADGET-{random.choice(string.ascii_uppercase)}-{random.randint(0, 9)}"
FINAL_CODE      = f"{ACTIVATION_CODE}-1945"


# ── Pools de questions ────────────────────────────────────────────────────────

POOL_STEP2 = [
    {
        "question": "Quel est le surnom donné à la première bombe atomique\n           lors du test Trinity (juillet 1945) ?",
        "check": lambda r: "gadget" in r.lower(),
        "error": "RÉPONSE INCORRECTE ÉTAPE 2",
    },
    {
        "question": "Dans quel État américain se trouve le site du test Trinity ?",
        "check": lambda r: "mexique" in r.lower() or "mexico" in r.lower(),
        "error": "RÉPONSE INCORRECTE ÉTAPE 2",
    },
    {
        "question": "Combien de bombes atomiques les États-Unis ont-ils utilisées\n           lors de la Seconde Guerre mondiale ?",
        "check": lambda r: r.strip() in ("2", "deux", "two"),
        "error": "RÉPONSE INCORRECTE ÉTAPE 2",
    },
    {
        "question": "En quel mois de 1945 s'est tenu le test Trinity ?\n           (répondre en chiffre ou en lettres)",
        "check": lambda r: "juillet" in r.lower() or "july" in r.lower() or r.strip() == "7",
        "error": "RÉPONSE INCORRECTE ÉTAPE 2",
    },
    {
        "question": "Quel est le nom de code du projet américain qui a conduit\n           à la création de la bombe atomique ?",
        "check": lambda r: "manhattan" in r.lower(),
        "error": "RÉPONSE INCORRECTE ÉTAPE 2",
    },
]

POOL_STEP4 = [
    {
        "question": "Quel élément chimique constituait le cœur de la bombe Trinity ?",
        "check": lambda r: "plutonium" in r.lower(),
        "error": "ÉLÉMENT INCORRECT ÉTAPE 4",
    },
    {
        "question": "Quel est le numéro atomique du plutonium,\n           l'élément au cœur de la bombe Trinity ?",
        "check": lambda r: r.strip() == "94",
        "error": "RÉPONSE INCORRECTE ÉTAPE 4",
    },
    {
        "question": "Quel est le symbole chimique du plutonium ? (2 lettres)",
        "check": lambda r: r.strip().lower() == "pu",
        "error": "SYMBOLE INCORRECT ÉTAPE 4",
    },
    {
        "question": "Quel élément chimique était utilisé dans Little Boy,\n           la bombe larguée sur Hiroshima ?",
        "check": lambda r: "uranium" in r.lower(),
        "error": "ÉLÉMENT INCORRECT ÉTAPE 4",
    },
]

POOL_STEP6 = [
    {
        "question": "En quelle année l'habilitation de sécurité\n           de J. Robert Oppenheimer fut-elle révoquée ?",
        "check": lambda r: r.strip() == "1954",
        "error": "ANNÉE INCORRECTE ÉTAPE 6",
    },
    {
        "question": "En quelle année J. Robert Oppenheimer est-il né ?",
        "check": lambda r: r.strip() == "1904",
        "error": "ANNÉE INCORRECTE ÉTAPE 6",
    },
    {
        "question": "En quelle année J. Robert Oppenheimer est-il décédé ?",
        "check": lambda r: r.strip() == "1967",
        "error": "ANNÉE INCORRECTE ÉTAPE 6",
    },
    {
        "question": "Dans quelle ville allemande Oppenheimer\n           a-t-il soutenu son doctorat ?",
        "check": lambda r: "g" in r.lower() and ("ttingen" in r.lower() or "ttingue" in r.lower()),
        "error": "VILLE INCORRECTE ÉTAPE 6",
    },
    {
        "question": "En quelle année a débuté le Projet Manhattan ?",
        "check": lambda r: r.strip() == "1942",
        "error": "ANNÉE INCORRECTE ÉTAPE 6",
    },
]


# ── Utilitaires ────────────────────────────────────────────────────────────────

def clear():
    os.system('clear')

def slow_print(text, delay=0.03):
    for ch in text:
        print(ch, end='', flush=True)
        time.sleep(delay)
    print()

def beep():
    print('\a', end='', flush=True)


def _timer_thread(seconds, stop_event):
    start = time.time()
    while not stop_event.is_set():
        remaining = seconds - (time.time() - start)
        if remaining <= 0:
            break
        color = RED if remaining < 10 else YELLOW
        print(f"\r{color}[⏱]  {int(remaining):02d}s{RESET}   ", end='', flush=True)
        time.sleep(0.2)
    print('\r' + ' ' * 20 + '\r', end='', flush=True)


def ask(prompt: str, timeout: int) -> tuple[str, bool]:
    stop_event = threading.Event()
    t = threading.Thread(target=_timer_thread, args=(timeout, stop_event), daemon=True)
    t.start()

    print(f"\n{CYAN}{prompt}{RESET}")
    print(f"{YELLOW}▶  {RESET}", end='', flush=True)

    ready = select.select([sys.stdin], [], [], timeout)
    stop_event.set()
    t.join(timeout=0.5)
    print()

    if ready[0]:
        return sys.stdin.readline().strip(), False
    return '', True


# ── Échec / succès ────────────────────────────────────────────────────────────

def fail_sequence(reason: str = "ERREUR D'AUTHENTIFICATION"):
    beep()
    print(f"\n\n{RED}{BOLD}")
    print("╔══════════════════════════════════════════════════════════╗")
    print(f"║  [!!!]  {reason:<47}  ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(RESET)
    time.sleep(0.4)

    for m in [
        "Protocole d'urgence activé",
        "Révocation des droits d'accès en cours",
        "Notification des autorités de sécurité",
        "Effacement de la session",
    ]:
        slow_print(f"{RED}[SYS] {m}...{RESET}", 0.04)
        time.sleep(0.25)

    print(f"\n{RED}{BOLD}", end='')
    for i in range(5, 0, -1):
        print(f"\r[!!!]  DÉCONNEXION DANS {i}s ...  ", end='', flush=True)
        time.sleep(1)

    print(f"\n[!!!]  SESSION RÉVOQUÉE{RESET}\n")
    time.sleep(0.4)
    sys.exit(1)


def ok_step(n: int):
    print(f"\n{GREEN}{BOLD}[✓]  ÉTAPE {n}/{TOTAL_STEPS} VALIDÉE{RESET}")
    time.sleep(0.9)


# ── Login ─────────────────────────────────────────────────────────────────────

VALID_USER = "osplosion"
VALID_PASS = "3e45ccf9e68432de465d141b44829cd8cdbad5d5ae156bda1c00c31ef90fcc4cc23eac661eed9a2b8c148341cac14b3e5bf6eb567e174bd09d770d5cf2db2aaa"

def login():
    clear()
    print(f"{RED}{BOLD}")
    for line in [
        "╔══════════════════════════════════════════════════════════╗",
        "║            LABORATOIRE NATIONAL DE LOS ALAMOS            ║",
        "║                   AUTHENTIFICATION REQUISE               ║",
        "╚══════════════════════════════════════════════════════════╝",
    ]:
        slow_print(line, 0.01)
    print(RESET)

    print(f"{YELLOW}login: {RESET}", end='', flush=True)
    try:
        user = sys.stdin.readline().strip()
    except EOFError:
        sys.exit(1)

    print(f"{YELLOW}Password: {RESET}", end='', flush=True)
    try:
        pwd = sys.stdin.readline().strip()
    except EOFError:
        sys.exit(1)

    if user != VALID_USER or pwd != VALID_PASS:
        fail_sequence("IDENTIFIANTS INCORRECTS")

    time.sleep(0.3)


# ── Intro ─────────────────────────────────────────────────────────────────────

def intro():
    clear()
    print(f"{RED}{BOLD}")
    for line in [
        "╔══════════════════════════════════════════════════════════╗",
        "║            LABORATOIRE NATIONAL DE LOS ALAMOS            ║",
        "║          TERMINAL DE SÉCURITÉ : NIVEAU TRINITY           ║",
        "║                    ACCÈS ULTRA-SECRET                    ║",
        "╚══════════════════════════════════════════════════════════╝",
    ]:
        slow_print(line, 0.01)
    print(RESET)
    time.sleep(0.3)

    for msg in [
        "[SYS] Initialisation du protocole Trinity...",
        "[SYS] Date système : 16 JUILLET 1945, 05:29:45",
        "[SYS] Opération : TEST GADGET, White Sands, Nouveau-Mexique",
        f"[SYS] Identifiant de session : {random.randint(100000, 999999)}",
    ]:
        slow_print(f"{YELLOW}{msg}{RESET}", 0.03)
        time.sleep(0.2)

    print(f"\n{RED}{'─' * 60}{RESET}")
    for line in [
        "Une tentative d'accès non autorisée a été détectée.",
        "Pour continuer, complétez la séquence d'autorisation en",
        f"{TOTAL_STEPS} étapes chronométrées.",
        "",
        "Toute erreur ou dépassement du délai imparti déclenchera",
        "le protocole de verrouillage d'urgence.",
    ]:
        slow_print(f"{WHITE}{line}{RESET}", 0.03)
    print(f"{RED}{'─' * 60}{RESET}")

    time.sleep(0.8)
    input(f"\n{DIM}[Appuyez sur ENTRÉE pour démarrer la séquence...]{RESET}")


# ── Étapes ────────────────────────────────────────────────────────────────────

def step1():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 1/7 : CODE D'ACCÈS INITIAL  ═══{RESET}\n")
    slow_print(f"{WHITE}Le panneau de contrôle principal affiche le code d'activation :{RESET}", 0.03)
    time.sleep(0.5)
    print(f"\n{GREEN}{BOLD}")
    print(f"   ╔══════════════════════╗")
    print(f"   ║  {ACTIVATION_CODE:<20}║")
    print(f"   ╚══════════════════════╝")
    print(RESET)
    slow_print(f"{WHITE}Saisissez exactement le code affiché. (30s){RESET}", 0.03)

    rep, to = ask("Code d'accès :", 30)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 1")
    if rep.strip().upper() != ACTIVATION_CODE:
        fail_sequence("CODE INVALIDE ÉTAPE 1")
    ok_step(1)


def step2():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 2/7 : VÉRIFICATION HISTORIQUE  ═══{RESET}\n")
    q = random.choice(POOL_STEP2)
    slow_print(f"{CYAN}Question : {q['question']}{RESET}", 0.03)

    rep, to = ask("Réponse :", 45)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 2")
    if not q["check"](rep):
        fail_sequence(q["error"])
    ok_step(2)


def step3():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 3/7 : SÉQUENCE D'AMORÇAGE  ═══{RESET}\n")
    slow_print(f"{RED}[COMPTE À REBOURS D'AMORÇAGE ACTIVÉ]{RESET}", 0.03)
    time.sleep(0.3)
    slow_print(f"{WHITE}Répétez exactement la séquence d'amorçage affichée.", 0.03)
    slow_print(f"Format : chiffres séparés par des tirets.{RESET}", 0.03)
    time.sleep(0.4)
    print(f"\n{GREEN}{BOLD}   SÉQUENCE :  {AMORÇAGE_SEQ}{RESET}\n")

    rep, to = ask("Séquence d'amorçage :", 25)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 3")
    if rep.strip() != AMORÇAGE_SEQ:
        fail_sequence("SÉQUENCE INVALIDE ÉTAPE 3")
    ok_step(3)


def step4():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 4/7 : IDENTIFICATION DU MATÉRIAU  ═══{RESET}\n")
    for line in [
        "La bombe du test Trinity, contrairement à Little Boy,",
        "reposait sur un processus d'implosion.",
    ]:
        slow_print(f"{WHITE}{line}{RESET}", 0.03)
    q = random.choice(POOL_STEP4)
    slow_print(f"\n{CYAN}Question : {q['question']}{RESET}", 0.03)

    rep, to = ask("Réponse :", 40)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 4")
    if not q["check"](rep):
        fail_sequence(q["error"])
    ok_step(4)


def step5():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 5/7 : CODE DE DÉSACTIVATION  ═══{RESET}\n")
    slow_print(f"{WHITE}En cas de défaillance critique, saisissez le code", 0.03)
    slow_print(f"de désactivation d'urgence affiché sur l'écran de contrôle :{RESET}", 0.03)
    time.sleep(0.4)
    print(f"\n{RED}{BOLD}")
    print(f"   ┌──────────────────────────────┐")
    print(f"   │  {GADGET_CODE:<28}│")
    print(f"   │  [DÉSACTIVATION D'URGENCE]   │")
    print(f"   └──────────────────────────────┘")
    print(RESET)
    slow_print(f"{WHITE}Saisissez le code EXACTEMENT tel qu'affiché. (30s){RESET}", 0.03)

    rep, to = ask("Code de désactivation :", 30)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 5")
    if rep.strip() != GADGET_CODE:
        fail_sequence("CODE INVALIDE ÉTAPE 5")
    ok_step(5)


def step6():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 6/7 : VÉRIFICATION BIOGRAPHIQUE  ═══{RESET}\n")
    for line in [
        "Le directeur scientifique du Projet Manhattan a marqué",
        "l'histoire autant par ses découvertes que par son destin personnel.",
    ]:
        slow_print(f"{WHITE}{line}{RESET}", 0.03)
    q = random.choice(POOL_STEP6)
    slow_print(f"\n{CYAN}Question : {q['question']}{RESET}", 0.03)

    rep, to = ask("Réponse :", 35)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ ÉTAPE 6")
    if not q["check"](rep):
        fail_sequence(q["error"])
    ok_step(6)


def step7():
    clear()
    print(f"\n{BOLD}{YELLOW}═══  ÉTAPE 7/7 : AUTORISATION FINALE  ═══{RESET}\n")
    beep()
    print(f"{RED}{BOLD}")
    for line in [
        "  ╔══════════════════════════════════════════╗",
        "  ║   SÉQUENCE D'AUTORISATION CRITIQUE       ║",
        "  ║   Cette étape est IRRÉVERSIBLE.          ║",
        "  ║   Aucune erreur n'est tolérée.           ║",
        "  ║   Délai : 20 secondes.                   ║",
        "  ╚══════════════════════════════════════════╝",
    ]:
        slow_print(line, 0.02)
    print(RESET)
    time.sleep(0.3)
    for line in [
        "Pour finaliser l'autorisation, entrez la clé de session.",
        "",
        "Format : [CODE D'ACCÈS DE L'ÉTAPE 1]-[ANNÉE DU TEST TRINITY]",
        "Exemple : TRINITY-XXXX-AAAA",
    ]:
        slow_print(f"{WHITE}{line}{RESET}", 0.03)

    rep, to = ask("Clé de session :", 20)
    if to:
        fail_sequence("DÉLAI DÉPASSÉ AUTORISATION FINALE")
    if rep.strip().upper() != FINAL_CODE:
        fail_sequence("CLÉ INVALIDE AUTORISATION REFUSÉE")
    ok_step(7)


# ── Victoire ──────────────────────────────────────────────────────────────────

def victory():
    clear()
    print(f"\n{GREEN}{BOLD}")
    for line in [
        "╔══════════════════════════════════════════════════════════╗",
        "║          AUTORISATION ACCORDÉE : ACCÈS TRINITY           ║",
        "╚══════════════════════════════════════════════════════════╝",
    ]:
        slow_print(line, 0.01)
    print(RESET)
    time.sleep(0.3)

    for msg in [
        "[SYS] Identité confirmée : J. ROBERT OPPENHEIMER",
        "[SYS] Niveau d'habilitation : ULTRA-SECRET",
        "[SYS] Chargement du programme de détonation...",
    ]:
        slow_print(f"{WHITE}{msg}{RESET}", 0.04)
        time.sleep(0.2)

    print(f"\n{YELLOW}\"Now I am become Death, the destroyer of worlds.\"")
    print(f"                                   J. Robert Oppenheimer{RESET}\n")
    time.sleep(1.5)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    try:
        login()
        intro()
        step1()
        step2()
        step3()
        step4()
        step5()
        step6()
        step7()
        victory()
        sys.exit(0)
    except KeyboardInterrupt:
        fail_sequence("INTERRUPTION DÉTECTÉE")
    except EOFError:
        sys.exit(1)


if __name__ == "__main__":
    main()

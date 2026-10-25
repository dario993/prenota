# 9. Autenticazione e ruoli

> Stato: fatto

## Login e sessione

1. L'utente invia email e password a una Server Action.
2. La password è verificata con **scrypt** (`node:crypto`, confronto a tempo costante).
3. Si crea una riga in `sessioni` con un token casuale e una scadenza (30 giorni fissi dal login, nessun rinnovo: scaduti, si rifà il login).
4. Il token va in un cookie **httpOnly**, `SameSite=Lax`, `Secure` in produzione.
   In produzione il cookie è `Secure`: il login funziona solo via HTTPS, non con `http://IP:porta` (in sviluppo sì). I form di login e primo accesso usano `method="post"`, così senza JavaScript la password non finisce mai nell'URL.
5. *Esci* cancella la riga e il cookie.

Un utente **disattivato** non può accedere e perde subito l'accesso anche con una sessione aperta (la sessione è verificata nel database a ogni richiesta, filtrando gli utenti attivi). Email e password errate, o utente disattivato, danno lo stesso messaggio: "Email o password errati". L'email è normalizzata (spazi tolti, minuscolo).

## Protezione delle pagine

- `src/proxy.ts` reindirizza a `/login` chi non ha il cookie di sessione (controllo veloce, solo presenza).
- Il controllo vero è sul server: ogni pagina, route API e Server Action verifica la sessione nel database e il ruolo.

## Permessi

| Azione | Operatore | Admin |
|---|---|---|
| Vedere eventi e prenotazioni | sì | sì |
| Creare / modificare / eliminare prenotazioni (anche di altri) | sì | sì |
| Elenco ristoranti, condividi, stampa | sì | sì |
| Locali, opere, eventi | no | sì |
| Utenti | no | sì |

Un operatore che apre una pagina `/admin/...` viene riportato alla home (`/`); se chiama direttamente un'azione admin, l'azione viene rifiutata con "Non autorizzato".

## Chiavi API (accesso remoto)

Create da **Admin → API key** (tabella `chiavi_api`, solo sha256 nel database). Con l'intestazione
`Authorization: Bearer <chiave>` `utenteCorrente()` restituisce l'admin che ha creato la chiave, purché sia ancora admin e attivo;
così la chiave vale su tutte le route API. In più `POST /api/sql` (solo admin) esegue qualsiasi query:

```bash
curl -X POST https://<host>/api/sql -H "Authorization: Bearer $CHIAVE" \
  -d '{"query": "select * from locali where capienza > $1", "params": [100]}'
# → {"righe": [...], "conteggio": n}; errore SQL → 400 {"errore": "..."}
```

Va usata rispettando le regole dell'app (importi in centesimi, tariffe usate nascoste e non eliminate). Una chiave sbagliata
non ricade sul cookie: risponde «Non autorizzato».

## Primo admin

Non ci sono credenziali predefinite. Finché il database non ha nessun utente, `/` e `/login` portano a `/primo-accesso`, dove si crea il primo admin (nome, email, password di almeno 8 caratteri, conferma password) e si entra subito nell'app. Appena esiste un utente, `/primo-accesso` rimanda a `/login`.

La creazione è protetta anche lato server: se ci sono già utenti l'azione si ferma subito (senza calcolare l'hash della password né bloccare la tabella); altrimenti inserisce l'utente solo se la tabella è vuota, con un blocco della tabella, così un invio diretto a database non vuoto è rifiutato e due invii simultanei creano un solo utente.

`npm run crea-admin` (legge `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOME` dall'ambiente) resta per il recupero: reimposta la password di un admin o ne crea un altro.

# 9. Autenticazione e ruoli

> Stato: da implementare

## Login e sessione

1. L'utente invia email e password a una Server Action.
2. La password è verificata con **scrypt** (`node:crypto`, confronto a tempo costante).
3. Si crea una riga in `sessioni` con un token casuale e una scadenza (30 giorni, rinnovata con l'uso).
4. Il token va in un cookie **httpOnly**, `SameSite=Lax`, `Secure` in produzione.
5. *Esci* cancella la riga e il cookie.

Un utente **disattivato** non può accedere e le sue sessioni vengono cancellate.

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

Un operatore che apre `/admin/...` o chiama un'azione admin riceve "non autorizzato".

## Primo admin

`npm run crea-admin` legge `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOME` dall'ambiente e crea l'utente admin.

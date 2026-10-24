# 15. Registro modifiche

| Data | Modifica | Pagine aggiornate |
|---|---|---|
| 2026-10-24 | Wiki iniziale scritta dal design approvato, prima del codice | tutte |
| 2026-10-24 | Scaffold Next.js 16 (dipendenze, Vitest, script npm, Tailwind v4) | 12 |
| 2026-10-24 | Logica di calcolo (persone, incassi, elenchi ristoranti, formati euro e data) con test | 4, 6 |
| 2026-10-24 | Schemi di validazione zod condivisi (prenotazione, locale, opera, evento, utente, login) con test | — |
| 2026-10-24 | Schema database, hash password scrypt e script `db:init` / `crea-admin` | 8, 12 |
| 2026-10-24 | Login con sessione (cookie + tabella `sessioni`, 30 giorni fissi), protezione pagine con `proxy.ts`, controlli di ruolo admin/operatore | 9 |
| 2026-10-24 | Guscio app: navigazione responsive (barra in basso / menu laterale), provider con cache locale, toast, componenti Contatore e Barra capienza | 11 |
| 2026-10-24 | Admin: pagina indice, gestione locali (nome, capienza) e opere (titolo, tariffario) con modifica ed eliminazione protetta; menu laterale fisso anche su pagine lunghe | 3 |
| 2026-10-24 | Admin: gestione eventi (opera, locale, data e ora italiana) e utenti (crea, modifica, attiva/disattiva con perdita immediata dell'accesso) | 3 |
| 2026-10-24 | Route di lettura (eventi, dettaglio evento, provenienze) e home "Prossimi eventi" con cache locale | 2, 7 |
| 2026-10-24 | Pagina evento: riepilogo (persone, posti liberi, quantità, coperti, incassi) ed elenco prenotazioni alfabetico con ricerca | 2 |
| 2026-10-24 | Prenotazioni: inserimento in una schermata (contatori, ristorante e pasto per i pacchetti, provenienze suggerite, totali in tempo reale, avviso di capienza che non blocca), salvataggio senza doppioni anche con doppio tocco, prezzi fissati alla creazione, modifica ed eliminazione con conferma; pagine admin più strette su desktop | 2, 5 |
| 2026-10-24 | Elenco ristoranti per evento (ristorante × pasto: nomi, telefono, coperti, note) con Condividi (menu del telefono o copia negli appunti) e Stampa a tutta larghezza senza menu | 6 |
| 2026-10-24 | Offline: nuove prenotazioni salvate sul telefono e inviate da sole al ritorno della rete (anche dopo aver chiuso l'app), senza doppioni; etichetta "in attesa di invio", contatore sul menu, invii rifiutati in rosso da scartare a mano, richiesta di nuovo login se la sessione è scaduta; modifica ed eliminazione disattivate senza rete; service worker e manifest per aprire l'app senza rete | 2, 10, 12 |
| 2026-10-24 | Offline: si torna all'evento e si aggiungono più prenotazioni di seguito anche partendo dalla home; Esci bloccato con prenotazioni non inviate e poi svuota i dati del telefono; login per sessione scaduta nella stessa scheda; errori 5xx riprovati da soli; motivo del rifiuto e quantità conservati anche dopo un riavvio | 2, 10 |
| 2026-10-24 | Immagine Docker (standalone su node:22-alpine), docker-compose con Postgres, script di backup, script npm docker:*; wiki rifinita (stati, decisioni) | 7, 12, 13, 14, README |
| 2026-10-24 | Backup sicuro (file temporaneo verificato, retention solo dopo successo), compose con password obbligatoria e porta solo su localhost | 13 |
| 2026-10-24 | Primo accesso obbligatorio: con database senza utenti l'app porta a `/primo-accesso` per creare il primo admin (nessuna credenziale predefinita); `crea-admin` resta per il recupero | 3, 9, 12, 13 |
| 2026-10-24 | Errore sugli importi delle opere che indica il campo sbagliato (es. «Importo non valido: Bambino») | 3 |
| 2026-10-24 | Primo accesso: con utenti già presenti la richiesta è rifiutata subito, senza calcolare la password né bloccare la tabella; wiki corretta sul comportamento di un operatore sulle pagine admin (torna alla home) | 9 |
| 2026-10-24 | Deploy: esempio compose per collegare l'app alla rete Docker del proxy esistente (senza porta pubblicata); README e note sviluppo: `crea-admin` solo per il recupero | 13, README |
| 2026-10-24 | Eventi passati raggiungibili: sezione chiusa "Eventi passati" in home (dal più recente) e titolo cliccabile in Admin → Eventi; senza rete e senza dati salvati compare "Serve la rete per caricare i dati la prima volta" invece di un caricamento infinito | 2, 3, 7, 10 |
| 2026-10-24 | Avviso di capienza nel form che conta anche le prenotazioni salvate sul telefono in attesa di invio, come il riepilogo dell'evento | 5, 14 |
| 2026-10-24 | Quantità della prenotazione scrivibili anche a mano (tastiera numerica), oltre ai pulsanti − / +: un gruppo da 35 non richiede 35 tocchi | 2, 11 |
| 2026-10-24 | Service worker: con la rete lenta una pagina già salvata compare dopo 4 s invece di restare bianca; la risposta arrivata in ritardo aggiorna comunque la copia salvata | 10 |
| 2026-10-24 | Login e primo accesso: `method="post"` sui form, la password non finisce mai nell'indirizzo neanche senza JavaScript; in sviluppo l'app è raggiungibile dalla rete locale (`allowedDevOrigins`); nota che in produzione il login richiede HTTPS | 9, 12, 13 |

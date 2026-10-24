# Wiki – Prenota

Documentazione della web app per le prenotazioni degli spettacoli teatrali.
**Va aggiornata a ogni modifica dell'app** (vedi [Manutenzione della wiki](#manutenzione-della-wiki)).

> Stato: wiki scritta **prima del codice**, a partire dal design approvato. Le pagine descrivono come l'app
> *dovrà* funzionare; ogni pagina riporta in alto lo stato di implementazione.

## Categorie e pagine

### 1. Prodotto
| # | Pagina | Contenuto |
|---|---|---|
| 1 | [Panoramica](01-panoramica.md) | Cos'è l'app, per chi è, cosa fa e cosa non fa, glossario |

### 2. Guida d'uso
| # | Pagina | Contenuto |
|---|---|---|
| 2 | [Manuale operatore](02-manuale-operatore.md) | Inserire e modificare prenotazioni, ricerca, elenco ristoranti, uso senza rete |
| 3 | [Manuale admin](03-manuale-admin.md) | Locali, opere e tariffario, eventi, utenti |

### 3. Regole di business
| # | Pagina | Contenuto |
|---|---|---|
| 4 | [Tariffe e incassi](04-tariffe-e-incassi.md) | Tipi di biglietto, pacchetto 22 + 27 €, prezzi congelati, formule ed esempi |
| 5 | [Capienza e posti](05-capienza-e-posti.md) | Conteggio persone, avviso oltre capienza, posti in testo libero |
| 6 | [Ristoranti e pacchetti](06-ristoranti-e-pacchetti.md) | Giamaica / Casale, pranzo / cena, elenco e condivisione |

### 4. Tecnica
| # | Pagina | Contenuto |
|---|---|---|
| 7 | [Architettura](07-architettura.md) | Stack e versioni, cartelle, flusso dei dati |
| 8 | [Database](08-database.md) | Tabelle, vincoli, migrazioni |
| 9 | [Autenticazione e ruoli](09-autenticazione-e-ruoli.md) | Login, sessioni, permessi admin / operatore |
| 10 | [Offline](10-offline.md) | Coda delle nuove prenotazioni, invio automatico, service worker |
| 11 | [Interfaccia e stile](11-interfaccia-e-stile.md) | Palette bianco / blu, layout mobile e desktop, componenti |

### 5. Operatività
| # | Pagina | Contenuto |
|---|---|---|
| 12 | [Sviluppo e test](12-sviluppo-e-test.md) | Setup locale senza Docker, comandi, test, checklist nel browser |
| 13 | [Deploy homelab](13-deploy-homelab.md) | Docker, compose, HTTPS, backup |

### 6. Storia
| # | Pagina | Contenuto |
|---|---|---|
| 14 | [Decisioni e roadmap](14-decisioni-e-roadmap.md) | Scelte fatte, limiti noti, evoluzioni |
| 15 | [Registro modifiche](15-registro-modifiche.md) | Storico delle modifiche |

## Documenti di progetto

- Design iniziale: [`docs/superpowers/specs/2026-10-24-prenota-design.md`](../superpowers/specs/2026-10-24-prenota-design.md)

## Manutenzione della wiki

Quando si modifica l'app, nello stesso commit:

1. aggiornare la pagina interessata (es. nuovo campo nel form → *Manuale operatore* + *Database*);
2. aggiornare lo stato in testa alla pagina (da implementare → in corso → fatto);
3. aggiungere una riga al [Registro modifiche](15-registro-modifiche.md);
4. se cambia qualcosa di essenziale (comandi, struttura, regole), aggiornare anche `CLAUDE.md` nella root.

<h1 style="color:#ffffff"> DOCUMENTAZIONE PROGETTO </h1>

## Librerie utilizzate:
    ├── eslint@8.10.0
    ├── express@4.17.3
    ├── moment@2.29.1
    └── socket.io@4.4.1

## Scopo del progetto
> Creazione pagina web che utilizza tecnologia **client/server** per comunicazione in tempo reale tra i vari _socket_

<br>

<h3 style="color:red"> Funzionamento: </h3>
- Aggiornamento in tempo reale di un sito per la prenotazione dei posti al cimena: tutti gli utenti connessi al sito potranno vedere le sedie prenotate daigli altri utenti e le proprio. Quando un utente prenota una o delle sedie, agli altri utenti viene aggiornata la matrice delle sedie e vedranno le sedie aggiornate.

<br><br>

<h1 style="color:#c93a3a;font-weight:bold"> BUGS FOUND </h1>
<ol>
    <li> In caso di selezione di molteplici posti c'è la possibilità che uno o più posti non vengano riservati/eliminati (legato molto probabilmente a el_array).<br> 
    <li> Il contatore posti selezionati non si azzera completamento dopo le operazioni di acquisto/clear

</ol>
<h1 style="color:#ffffff"> DOCUMENTAZIONE PROGETTO </h1>

## Librerie utilizzate:
    ├── eslint@8.10.0
    ├── express@4.17.3
    ├── moment@2.29.1
    └── socket.io@4.4.1

## Scopo del progetto
> Creazione pagina web che utilizza tecnologia **client/server** per comunicazione in tempo reale tra i vari _socket_

<br>

<h2 style="color:red"> Funzionamento: </h2>
Progetto basato su comunicazione tra client e server dove se un client modifica lo stato di una sedia del cinema in automatico tutti gli altri client vedranno la modifica fatta senza il bisogno di ricaricare la pagina. 
Possibilità anche di avere un admin (inserendo admin:admin come nickname) che potrà gestire i posti e le prenotazioni andando ad annullare a suo piacimento le prenotazioni

<br><br>

<h1 style="color:#c93a3a;font-weight:bold"> BUGS FOUND </h1>
<ol>
    <li> In caso di selezione di molteplici posti c'è la possibilità che uno o più posti non vengano riservati/eliminati (legato molto probabilmente a el_array).<br> 
    <li> Il contatore dei posti selezionati non si azzera completamento dopo le operazioni di acquisto/clear

</ol>
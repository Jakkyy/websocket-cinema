<h1 style="color:#ffffff"> DOCUMENTAZIONE PROGETTO </h1>

## Scopo del progetto:
> Creazione pagina web che utilizza tecnologia **client/server** per comunicazione in tempo reale tra i vari _socket_

<br>

<h2 style="color:#ffffff"> Funzionamento: </h2>
Progetto basato su comunicazione tra client e server dove se un client modifica lo stato di una sedia del cinema in automatico tutti gli altri client vedranno la modifica fatta senza il bisogno di ricaricare la pagina. 
Possibilità anche di avere un admin (inserendo admin:admin come nickname) che potrà gestire i posti e le prenotazioni andando ad annullare a suo piacimento le prenotazioni

<br>

## Librerie utilizzate:
    ├── eslint@8.10.0
    ├── express@4.17.3
    ├── moment@2.29.1
    └── socket.io@4.4.1
**Eslint** → pacchetto usato per mantenere lo stile dei file uguali per tutti (regole in **_.eslintrc.json_**) <br>
**Express** → creazione del server hostato in locale sulla porta **3000** <br>
**Moment** → gestione e formattazione delle date (con possibilità di convertire **_unix_** in **_data_**) <br>
**Socket.io** → creazione di un socket per ogni client che entra nella pagina (utilizzo tecnologia **_websocket_**) 

<br>

<h1 style="color:#1ad973;font-weight:bold"> TO ADD </h1>
<ol>
    <li> Miglioramenti nella parte grafica (svg sedie, aggiungere spazi personalizzati tra le varie file)
    <li> Possibilità di vedere da un client il nome della persona che ha prenotato il posto cliccato
    <li> Creazione di una box con caricamento durante la fase di reserving
    <li> Maggiore controlli nella parte server per i dati in data.json
</ol>

<h1 style="color:#c93a3a;font-weight:bold"> BUGS FOUND </h1>
<ol>
    <li> In caso di selezione di molteplici posti c'è la possibilità che uno o più posti non vengano riservati/eliminati (legato molto probabilmente a el_array).<br> 
    <li> Il contatore dei posti selezionati non si azzera completamento dopo le operazioni di acquisto/clear
</ol>


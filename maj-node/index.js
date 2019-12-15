
//tile range is 0-133, 1-man is 0-3, 2-man is 4-7, etc

/*
when connecting to the server, a specific HELO string must be sent to the 
server with details about the user. In this case, since the bot
has no account, we provide a name of NoName, and a sx of M.

A heartbeat is sent every 5 seconds to maintain a connection to the server

Whenever the server messages the client, the function onmessage is called
which parses the sent JSON and responds with the needed string
*/

/*
Definitions of JSON strings:

HELO: a confirmation string sent by both client and server when establishing
    a connection

TAIKYOKU: a message from the server asking the client to 'ready up' at the start
        of each match. The client must respond with the strings GOK and NEXTREADY
        
*/
const WebSocket = require('isomorphic-ws');

const ws = new WebSocket('wss://p.mjv.jp', {
    origin: 'http://tenhou.net',
});

ws.onopen = function open() {
    console.log('connected');
    ws.send('{"tag":"HELO","name":"NoName","sx":"M"}');
};

ws.onclose =  function open() {
    console.log('disconnected');
    process.exit(0);
};

slowsend = function(msg) {
    setTimeout(() => {
        ws.send(msg);
    },
    1000);
}

heloHandler = function (heloMsg) {
    console.log('HELO from server, you are', heloMsg.uname);
    slowsend('<PXR V="9">');
    slowsend(JSON.stringify({tag: 'JOIN', t: '0,0'}));
};

lnhandler = function (lnMsg) {
    console.log('LN from server', { lnMsg });
}

readyup_handler = function (readymessage) {
    // sends a message to the server telling it that the user has clicked 'OK'
    console.log('Lets play! Dealer is', +readymessage.oya + 1);
    slowsend('{"tag": "GOK"}');
    slowsend('{"tag": "NEXTREADY"}');   
}

ws.onmessage = function incoming(message) {
    const msg = JSON.parse(message.data);
    // console.log({msg});
    switch(msg.tag) {
        case 'HELO':
            heloHandler(msg);
            break;
        case 'LN':
            lnhandler(msg)
            break;
        case 'TAIKYOKU':
            readyup_handler(msg)
            break;
        case 'INIT':
            console.log('Hai', msg.hai);
            break;
        case 'RYUUKYOKU':
            console.log('Round Over!')
            slowsend('{"tag": "NEXTREADY"}');
            
            //this function may not work here, as you don't normally send the string '{"tag": "GOK"}' in this scenario
            break;
        default:
            if (msg.tag.startsWith('T')) {
                const drawnTile = msg.tag.substring(1);
                console.log('Drew', drawnTile);
                slowsend('{"tag":"D","p":' + drawnTile + '}');
            } else if ('t' in  msg) {
                console.log({ t: msg.t });
                slowsend('{"tag":"N"}');
            } else {
                console.log('Something else', { msg });
            }
    }
};

ws.onerror = function ohno(err) {
    console.log(err);
};

ws.onupgrade = function upgraded(req) {
};

// ws.on('unexpected-response', function whattha(req, res) {
//     console.log(req, res);
// });

ws.onping = function pinged(data) {
};


setInterval(
    function () {
        ws.send('<Z />');
    },
    5000);

/*uppercase T is always you. The player to your right is U, then V, then W
 When the only thing sent by the server is one of these letters, it is
 telling the client who's turn it currently is

 Additionally, when T sent to client it is followed by a number corresponding to
 a tile. This only happens for T, as you only know what you drew.

 Upon discarding, instead of using TUVW, DEFG is used. Since every player knows
 what the others have discarded, these messages always are followed by a number

 A lowercase t signals that a call is being made.
*/


/*

calls:
Pon: 1
Chi: 4

*/

/* Reach/Riichi is divided into 2 steps

step 1 consists of REACH, who, and step
        who is a number from 0 to 4, signalling who is making the declaration
        for step 1, step is 1

step 2 consists of Reach, who, ten, and step
    who is the same number as in step 1, step is now equal to 2, and ten is the new
    score of each player after the riichi

*/
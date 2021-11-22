// In order for our ES6 shim to find the class, we must export it
// from the root of the CommonJS bundle
const Counter = require('./counter.js')
exports.Counter = Counter

async function handleErrors(request, func) {
    try {
      return await func();
    } catch (err) {
      if (request.headers.get("Upgrade") == "websocket") {
        // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
        // won't show us the response body! So... let's send a WebSocket response with an error
        // frame instead.
        let pair = new WebSocketPair();
        pair[1].accept();
        pair[1].send(JSON.stringify({error: err.stack}));
        pair[1].close(1011, "Uncaught exception during session setup");
        return new Response(null, { status: 101, webSocket: pair[0] });
      } else {
        return new Response(err.stack, {status: 500});
      }
    }
  }

exports.handlers = {
    async fetch(request, env) {
        return await handleErrors(async () => {
            
            let url  = new URL(request.url);
            let path = url.pathname.substring(1).split("/");
                
            if(!path[0]) {
                return new Response('HOME PAGE', {
                    status: 
                })
            } 

            switch(path[0]) {

            }
        });
    }
}



async function handleRequest(request, env) {
  let id = env.COUNTER.idFromName('A')
  let obj = env.COUNTER.get(id)

  let resp = await obj.fetch(request.url);
  let respText = await resp.json();

  return new Response(JSON.stringify(requestHeaders));
}
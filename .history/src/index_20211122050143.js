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
                return new Response('HOME PAGE', {headers: {
                    "Content-Type": "text/html;charset=UTF-8"
                }});
            } 

            switch(path[0]) {
                case "api":
                    //  /api/...
                    return handleApiRequest(path.slice(1), request, env);
                default:
                    return new Response("Not found", {status: 404});
            }
        });
    }
}

async function handleApiRequest(path, request, env) {

    switch (path[0]) {
        case "room": {
            if(!path[1]) {
                if(request.method === 'POST') {
                    let id = env.COUNTER.uniqueId();
                    return new Response(id.toString(), {
                        headers: { "Access-Control-Allow-Origin": "*" }
                    });
                } else {
                    return new Response("Method not allowed", { status: 405 }); 
                }
            }
            

            let id;
            let name = path[1]; 

            if(name.match(/^[0-9a-f]{64}$/)) {
                id = env.COUNTER.idFromString(name);
            } else if (name.length <= 32) {
                id = env.COUNTER.idFromName(name);
            } else {
                return new Response("Name too long", { status: 404 });
            }

            let counterObject = env.COUNTER.get(id); 
            let newUrl = new URL(request.url); 

            newUrl.pathname = "/" + path.slice(2).join("/");
            return counterObject.fetch(newUrl, request);
        }
        default:
            return new Response("Not found", {status: 404});
    }
}

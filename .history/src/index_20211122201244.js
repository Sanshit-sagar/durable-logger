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
    try {
      return await handleRequest(request, env)
    } catch (e) {
      return new Response(e.message)
    }
  },
}

async function handleRequest(request, env) {

    let url = new URL(request.url);
    let path = url?.pathname?.splice(1)?.split('/');

    console.log(`Extracted path: ${path || 'N/A'}`); 

    if(!path?.length || !path[0]) { // "....com/" 
        console.log(`Returning content at .com/root`);
        return new Response('Analytic.ly homepage', {
            headers: { "Content-type": "text/html;charset=UTF-8" },
        });
    }

    switch(path[1]) {
        case 'slug': 
            return handleApiRequest(path.slice(1), request, env); 
        default: 
            return new Response("Method not allowed", 405); 
    }
}

async function handleApiRequest(path, request, env) {
    console.log(`Inside 2nd API Request handler`)

    if(path?.length && path[0]) {
        let name = path[1];
        let id; 

        if(req.method === 'GET') { 
            if (name.match(/^[0-9a-f]{64}$/)) {
                id = env.COUNTER.idFromString(name);
            } else if(name.length < 32) {
                id = env.COUNTER.idFromName(name);
            } else {
                return new Response("Name too long. Unprocessable Entity",  { status: 409 });
            }
        } else {
            return new Response("Not found", { status: 404 })
        }
        
        let slugDetailsObject = env.COUNTER.get(id);
        let newUrl = new URL(request.url);
        newUrl.pathname = "/" + path.slice(2).join("/");

        console.log(`Fetching from object with url: ${newUrl.pathname}`);
        return slugDetailsObject.fetch(newUrl, request); 
    } else {
        return new Response("Get Database Info here", 205)
    }
}
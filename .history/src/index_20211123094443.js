// In order for our ES6 shim to find the class, we must export it
// from the root of the CommonJS bundle
const Counter = require('./counter.js')
exports.Counter = Counter

function isHexEncoded(str) {
    return str.match(/^[0-9a-f]{64}$/)
}
function isValidName(str) {
    return str.length <= 32;
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
    let path = url.pathname.slice(1).split('/');

    if(!path?.length || !path[0]) { // "....com/" 
        return new Response('Analytic.ly homepage', {
            headers: { "Content-type": "text/html;charset=UTF-8" },
        });
    }

    switch(path[0]) {
        case 'slug': 
            return handleApiRequest(path.slice(1), request, env); 
        default: 
            return new Response("Method not allowed", { status: 405 }); 
    }
}

async function handleApiRequest(path, request, env) {
    console.log(`Inside 2nd API Request handler`)

    if(path?.length && path[0]) {

        let id; 
        let name = path[0];

        if(request.method === 'GET') { 
            if (isHexEncoded(name)) {
                id = env.COUNTER.idFromString(name);
                console.log(`Retreived id from string : ${id}`)
            } else if(isValidName(name)) {
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

        console.log(`Fetching from object with url: ${newUrl}`);
        return slugDetailsObject.fetch(newUrl, request); 
    } else {
        return new Response("Get Database Info here", { status: 205 })
    }
}
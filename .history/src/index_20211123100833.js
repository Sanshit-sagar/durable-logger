// In order for our ES6 shim to find the class, we must export it
// from the root of the CommonJS bundle
const Counter = require('./counter.js')
exports.Counter = Counter

const UNPROCESSABLE_ENTITY_STR = "Name too long. Unprocessable Entity"; 
const RESOURCE_NOT_FOUND_STR = "Resource Not found";
const METHOD_NOT_ALLOWED_STR = "Method not allowed";

function isHexEncoded(str) {
    return str.match(/^[0-9a-f]{64}$/)
}
function isValidName(str) {
    return str.length >= 5 && str.length <= 32;
}

function NotFoundError(message) {
    return new Response(RESOURCE_NOT_FOUND_STR || message, { 
        status: 404 
    })
}
function MethodNotAllowedError(message) {
    return new Response(METHOD_NOT_ALLOWED_STR || message, { 
        status: 405 
    })
}
function UnprocessableEntityError(message) { 
    return new Response(UNPROCESSABLE_ENTITY_STR || message,  { 
        status: 409 
    });
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
            return NotFoundError(); 
    }
}

async function handleApiRequest(path, request, env) {
   
    if(path?.length && path[0]) {
        let id; 
        let name = path[0];

        if(request.method === 'GET') { 
            if (isHexEncoded(name)) {
                id = env.COUNTER.idFromString(name);
            } else if(isValidName(name)) {
                id = env.COUNTER.idFromName(name);
            } else {
                return UnprocessableEntityError();
            }
        } else {
            return MethodNotAllowedError();
        }
        
        let slugDetailsObject = env.COUNTER.get(id);

        let newUrl = new URL(request.url);
        newUrl.pathname = "/" + path.slice(2).join("/");

        return slugDetailsObject.fetch(newUrl, request); 
    } else {
        return new Response("Get Database Info here", { status: 205 })
    }
}
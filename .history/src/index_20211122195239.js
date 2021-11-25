// In order for our ES6 shim to find the class, we must export it
// from the root of the CommonJS bundle
const Counter = require('./counter.js')
exports.Counter = Counter


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
    let path = url.pathname.splice(1).split('/');

    console.log(`Extracted path: ${path}`); 

    if(!path[0]) { // "....com/" 
        console.log(`Returning content at .com/root`);
        return new Response('Analytic.ly homepage', {
            headers: { "Content-type": "text/html;charset=UTF-8" },
        });
    }

    switch(path[1]) {
        case 'slug': 
            return handleApiRequest(path.slice(1), request, env); 
        default: 
            return new Response("Method not available", 405); 
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
                return new Response("Name too long",  { status: 404 });
            }
        }
        
        let slugDetailsObject = env.COUNTER.get(id);
        let newUrl = new URL(request.url);
        newUrl.pathname = "/" + path.slice(2).join("/");

        console.log(`Fetching from object with url: ${newUrl.pathname}`);
        return slugDetailsObject
    } else {
        return new Response("Get Database Info here", 205)
    }
}

//   let id = env.COUNTER.idFromName('A')
//   let obj = env.COUNTER.get(id)

//   let resp = await obj.fetch(request.url, request);
//   let respText = await resp.json();

//   return new Response(JSON.stringify(respText));}
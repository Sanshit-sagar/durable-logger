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

    if(!path[0]) { // "....com/" 
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

    switch(path[0]) {
        case "slug": 
            //      /api/slug
            if(!path[1]) {
                if(req.method === 'POST')

                } else {
                    
                }

    }
}

//   let id = env.COUNTER.idFromName('A')
//   let obj = env.COUNTER.get(id)

//   let resp = await obj.fetch(request.url, request);
//   let respText = await resp.json();

//   return new Response(JSON.stringify(respText));}
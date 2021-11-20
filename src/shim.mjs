
async function handleErrors(request, func) {
    try {
        return await func();
    } catch (err) {
      
        if (request.headers.get("Upgrade") == "websocket") {
            let pair = new WebSocketPair();
            pair[1].accept();
            pair[1].send(JSON.stringify({ error: err.stack }));
            pair[1].close(1011, "Uncaught exception during session setup");
            
            return new Response(null, { 
                status: 101, 
                webSocket: pair[0] 
            });
        } else {
            return new Response(err.stack, {
                status: 500
            });
        }
    }
}

export default {
    async fetch(request, env) {
         return await handleErrors(request, async () => {
            let url = new URL(request.url);
            let path = url.pathname.slice(1).split('/');
        
            if (!path[0]) {
                return new Response('Hi there', { headers: {"Content-Type": "text/html;charset=UTF-8" }});
            }
        
            switch(path[0]) {
                case '/api': 
                    return handleApiRequest(path.slice(1), request, env); 
                default: 
                    return new Response("Not Found", { status: 404 }); 
            }
        });
    }
}

async function handleApiRequest(path, request, env) {
    let name = path[1]
    
    let id = env.COUNTER.idFromName(name)
    let obj = env.COUNTER.get(id)
    let resp = await obj.fetch(request.url)
    let scoreOnPage = parseInt(await resp.text())

    return new Response(`User: ${name}, Score: ${scoreOnPage}`)
}

class Counter {
    constructor(state, env) {
        this.state = state;
        this.env = env; 

        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            this.views = storedViews || 0;
        });
    }

    async fetch(request) {
        let { method } = new URL(request.url);
        let currentViews = this.views;

        switch (method) {
            case "POST":
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "GET":
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "DELETE":
                currentViews = --this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "/":
                break;
            default:
                return new Response("Not found", { status: 404 });
        }

        return new Response(currentViews);
    }
} 

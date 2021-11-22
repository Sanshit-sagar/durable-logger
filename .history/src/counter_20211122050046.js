module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        
        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            this.views = storedViews || 0;
        });
    }

    async fetch(request) {
        return await handleErrors(request, async () => {
            let url = new URL(request.url);
      

            switch (url.pathname) {
                case "/websocket": {
                    if (request.headers.get("Upgrade") != "websocket") {
                        return new Response("expected websocket", {status: 400});
                    }
                    let ip = request.headers.get("CF-Connecting-IP");
                   
                    return new Response('Got this far', { 
                        status: 101, 
                        webSocket: pair[0] 
                    });
                }
                default:
                    return new Response("Not found", {
                        status: 404
                    });
            }
        });
    }
}
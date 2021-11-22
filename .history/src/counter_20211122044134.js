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
              // The request is to `/api/room/<name>/websocket`. A client is trying to establish a new
              // WebSocket session.
              if (request.headers.get("Upgrade") != "websocket") {
                return new Response("expected websocket", {status: 400});
              }
    
              // Get the client's IP address for use with the rate limiter.
              let ip = request.headers.get("CF-Connecting-IP");
    
              // To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
              // i.e. two WebSockets that talk to each other), we return one end of the pair in the
              // response, and we operate on the other end. Note that this API is not part of the
              // Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
              // any way to act as a WebSocket server today.
              let pair = new WebSocketPair();
    
              // We're going to take pair[1] as our end, and return pair[0] to the client.
              await this.handleSession(pair[1], ip);
    
              // Now we return the other end of the pair to the client.
              return new Response(null, { status: 101, webSocket: pair[0] });
            }
    
            default:
              return new Response("Not found", {status: 404});
          }
        });
      }

  
    async fetch(request) {
        let url = new URL(request.url);

        let currentViews = this.views;
        let requestHeaders = [...request.headers];

        console.log(requestHeaders);

        switch (url.pathname) {
            case "/increment":
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "/decrement":
                currentViews = --this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "/":

                break;
            default:
                return new Response("Not found", { 
                    status: 404 
                });
        }

        const respData = {
            views: currentViews,
            timestamp: new Date().getTime(),
        };
        console.log(respData); 

        const json = JSON.stringify(respData, null, 2)

        return new Response(json,  {
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
        }); 
    }
  }
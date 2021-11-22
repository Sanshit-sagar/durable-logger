module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        
        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            this.views = storedViews || 0;
        });
    }


    
  
    async fetch(request) {
        let url = new URL(request.url);

        let currentViews = this.views;
        let requestHeaders = [...request.headers];

        console.log(requestHeaders);

        switch (url.pathname) {
            case "/websocket": {
                // The request is to `/api/room/<name>/websocket`. A client is trying to establish a new
                // WebSocket session.
                if (request.headers.get("Upgrade") != "websocket") {
                  return new Response("expected websocket", {status: 400});
                }
                let ip = request.headers.get("CF-Connecting-IP");
                let pair = new WebSocketPair();
                await this.handleSession(pair[1], ip);
                return new Response(null, { status: 101, webSocket: pair[0] });
            }
    
            default:
              return new Response("Not found", {status: 404});
          }
        });
      }
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
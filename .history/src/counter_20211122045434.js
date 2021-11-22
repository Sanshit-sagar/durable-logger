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
                    let pair = new WebSocketPair();
                    await this.handleSession(pair[1], ip);
                    return new Response(null, { status: 101, webSocket: pair[0] });
                }
                default:
                    return new Response("Not found", {status: 404});
            }
        });
    }

    async handleSession(webSocket, ip) {
        webSocket.accept();
    
        let session = { webSocket, blockedMessages: [] };
        this.sessions.push(session);
    
        this.sessions.forEach(otherSession => {
            if (otherSession.name) {
                session.blockedMessages.push(JSON.stringify({joined: otherSession.name}));
            }
        });

        let storage = await this.storage.list({ reverse: true, limit: 100 });
        let backlog = [...storage.values()];

        backlog.reverse();
        backlog.forEach(value => {
            session.blockedMessages.push(value);
        });
    
        let receivedUserInfo = false;
        webSocket.addEventListener("message", async msg => {
          try {
            if (session.quit) {
                webSocket.close(1011, "WebSocket broken.");
                return;
            }
            
            let data = JSON.parse(msg.data);
    
            if (!receivedUserInfo) {
              session.name = "" + (data.name || "anonymous");

                if (session.name.length > 32) {
                    webSocket.send(JSON.stringify({error: "Name too long."}));
                    webSocket.close(1009, "Name too long.");
                    return;
                }
    
                session.blockedMessages.forEach(queued => {
                    webSocket.send(queued);
                });

                delete session.blockedMessages;
                this.broadcast({ joined: session.name });
        
                webSocket.send(JSON.stringify({ready: true}));
                receivedUserInfo = true;

                return;
            }
    
            // Construct sanitized message for storage and broadcast.
            data = { 
                name: session.name, 
                message: "" + data.message 
            };
    
            if (data.message.length > 256) {
                webSocket.send(JSON.stringify({error: "Message too long."}));
                return;
            }
    
       
            data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
            this.lastTimestamp = data.timestamp;
            let dataStr = JSON.stringify(data);
            this.broadcast(dataStr);
           
            let key = new Date(data.timestamp).toISOString();
            await this.storage.put(key, dataStr);
          } catch (err) {
            webSocket.send(JSON.stringify({error: err.stack}));
          }
        });
    
        let closeOrErrorHandler = evt => {
          session.quit = true;
          this.sessions = this.sessions.filter(member => member !== session);
          if (session.name) {
            this.broadcast({quit: session.name});
          }
        };
        webSocket.addEventListener("close", closeOrErrorHandler);
        webSocket.addEventListener("error", closeOrErrorHandler);
      }
    
      broadcast(message) {
        if (typeof message !== "string") {
            message = JSON.stringify(message);
        }
    
        let quitters = [];
        this.sessions = this.sessions.filter(session => {
            if (session.name) {
                try {
                    session.webSocket.send(message);
                    return true;
                } catch (err) {
                    session.quit = true;
                    quitters.push(session);
                    return false;
                }
            } else {
                session.blockedMessages.push(message);
                return true;
            }
        });
    
        quitters.forEach(quitter => {
            if (quitter.name) {
                this.broadcast({
                    quit: quitter.name
                });
            }
        });
    }
}
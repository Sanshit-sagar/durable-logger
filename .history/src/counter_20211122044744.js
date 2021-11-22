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
    
        let limiterId = this.env.limiters.idFromName(ip);
        let limiter = new RateLimiterClient(
            () => this.env.limiters.get(limiterId),
            err => webSocket.close(1011, err.stack));
    

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
    
            // Check if the user is over their rate limit and reject the message if so.
            if (!limiter.checkLimit()) {
                webSocket.send(JSON.stringify({
                    error: "Your IP is being rate-limited, please try again later."
                }));
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
                this.broadcast({joined: session.name});
        
                webSocket.send(JSON.stringify({ready: true}));
                receivedUserInfo = true;
    
              return;
            }
    
            // Construct sanitized message for storage and broadcast.
            data = { name: session.name, message: "" + data.message };
    
            // Block people from sending overly long messages. This is also enforced on the client,
            // so to trigger this the user must be bypassing the client code.
            if (data.message.length > 256) {
              webSocket.send(JSON.stringify({error: "Message too long."}));
              return;
            }
    
            // Add timestamp. Here's where this.lastTimestamp comes in -- if we receive a bunch of
            // messages at the same time (or if the clock somehow goes backwards????), we'll assign
            // them sequential timestamps, so at least the ordering is maintained.
            data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
            this.lastTimestamp = data.timestamp;
    
            // Broadcast the message to all other WebSockets.
            let dataStr = JSON.stringify(data);
            this.broadcast(dataStr);
    
            // Save message.
            let key = new Date(data.timestamp).toISOString();
            await this.storage.put(key, dataStr);
          } catch (err) {
            // Report any exceptions directly back to the client. As with our handleErrors() this
            // probably isn't what you'd want to do in production, but it's convenient when testing.
            webSocket.send(JSON.stringify({error: err.stack}));
          }
        });
    
        // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
        // a quit message.
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
    
      // broadcast() broadcasts a message to all clients.
      broadcast(message) {
        // Apply JSON if we weren't given a string to start with.
        if (typeof message !== "string") {
          message = JSON.stringify(message);
        }
    
        // Iterate over all the sessions sending them messages.
        let quitters = [];
        this.sessions = this.sessions.filter(session => {
          if (session.name) {
            try {
              session.webSocket.send(message);
              return true;
            } catch (err) {
              // Whoops, this connection is dead. Remove it from the list and arrange to notify
              // everyone below.
              session.quit = true;
              quitters.push(session);
              return false;
            }
          } else {
            // This session hasn't sent the initial user info message yet, so we're not sending them
            // messages yet (no secret lurking!). Queue the message to be sent later.
            session.blockedMessages.push(message);
            return true;
          }
        });
    
        quitters.forEach(quitter => {
          if (quitter.name) {
            this.broadcast({quit: quitter.name});
          }
        });
      }
}
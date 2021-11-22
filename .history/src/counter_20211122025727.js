module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        
        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            let storedHistory = await this.state.storage.get("history")

            this.views = storedViews || 0;
            this.history = storedHistory || []; 
        });
    }
  
    async fetch(request) {
        let url = new URL(request.url);

        let ip = request.headers.get('CF-Connecting-IP');
        let storageKey = `${ip}-${new Date().getTime()}`; 
        let ipData = await request.text(); 

        let storagePromise = this.state.storage.put(storageKey, ipData); 
        await storagePromise; 

        let currentViews = this.views;
        let currentHistory = this.history; 
        
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
            case "/list":
                let items = await this.state.storage.list(); 
                return new Response
            default:
                return new Response("Not found", { status: 404 });
        }

        const respData = {
            views: currentViews,
            timestamp: new Date().getTime(),
        };

        const json = JSON.stringify(respData, null, 2)

        return new Response(json,  {
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
        }); 
    }
  }
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
            case "/push":
                currentHistory = (currentHistory.)
                await this.state.storage.put("history", [...currentHistory, new Date().getTime()])

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

        const json = JSON.stringify(respData, null, 2)

        return new Response(json,  {
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
        }); 
    }
  }
module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        
        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            let storedLogs = await this.state.storage.get("logs"); 
            this.views = storedViews || 0;
            this.logs = storedLogs || []; 
        });
    }

    async fetch(request) {
        let url = new URL(request.url);

        let currentViews = this.views;
        let currentLogs = this.logs; 
        let updatedLen;
        let dayOfYear =  Math.floor((Date.now() - Date.parse(new Date().getFullYear(), 0, 0)) / 86400000)

        switch (url.pathname) {
            case "/increment":
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);

                let res = { timestamp: Date.now(), ip: request.headers. };
                Object.entries(request.cf).forEach((entry) => {
                    if(entry && entry[1]?.length) {
                       res[entry[0]] = entry[1]
                    };
                })

                updatedLen = this.logs.push(res);
                break;
            case "/decrement":
                currentViews = --this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "/get":
                currentLogs = Object.entries(this.logs);
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
            dayOfYear: dayOfYear,
            updatedLen: updatedLen,
            currentLogs: currentLogs
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
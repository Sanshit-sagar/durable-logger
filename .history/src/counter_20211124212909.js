function getDayOfYear() {
    let timeSinceEpoch = (Date.now() - Date.parse(new Date().getFullYear(), 0, 0));
    return Math.floor(timeSinceEpoch / 86400000); 
}


module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        this.env = env; 
        
        this.state.blockConcurrencyWhile(async () => {
            let storedViews = await this.state.storage.get("views");
            let storedLogs = await this.state.storage.get("logs"); 
            this.views = storedViews || 0;
            this.logs = storedLogs || []; 
        });
    }

    async fetch(request) {
        let url = new URL(request.url);

        let currentSlug = url;
        let currentLogs = this.logs; 
        let currentViews = this.views;
        let storageKey =  getDayOfYear(); 
        let valuesForKey = this.logs.length; 

        switch (url.pathname) {
            case "/increment":
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);

                let res = { 
                    timestamp: Date.now(), 
                    headers: Object.fromEntries(request.headers),
                };

                Object.entries(request.cf).forEach((entry) => {
                    if(entry && entry[1]?.length) {
                       res[entry[0]] = entry[1]
                    };
                });

                this.logs.push(res);
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
            views: this.logs.length,
            dayOfYear: getDayOfYear(),
            currentLogs: this.logs,
            viewsOnDay: valuesForKey
        };
     
        const json = JSON.stringify(respData, null, 2)
        console.log(json); 

        return new Response(json,  {
            headers: {
              "content-type": "application/json;charset=UTF-8"
            }
        }); 
    }
}
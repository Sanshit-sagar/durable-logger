function getDayOfYear() {
    let timeSinceEpoch = (Date.now() - Date.parse(new Date().getFullYear(), 0, 0));
    return Math.floor(timeSinceEpoch / 86400000); 
}


module.exports = class Counter {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        
        this.state.blockConcurrencyWhile(async () => {
            let storedLogs = await this.state.storage.get("logs"); 
            let storedViews = await this.state.storage.get("views");
            let storedLastSeen = await this.state.storage.get("lastSeen"); 

            this.logs = storedLogs || []; 
            this.views = storedViews || 0;
            this.lastSeen = storedLastSeen || Date.now();
        });
    }

    async fetch(request) {
       
        let url = new URL(request.url);
        let currentViews = this.views;
        let updatedLen = this.logs?.length;

        console.log(`Accessing a durable object => ${JSON.stringify([...request.headers])}`)

        switch (url.pathname) {
            case "/":

                console.log(`Accessed /increment`);
                currentViews = ++this.views;
                await this.state.storage.put("views", this.views);

                let res = { 
                    timestamp: Date.now(), 
                    headers: Object.fromEntries(request.headers),
                };
ss
                Object.entries(request.cf).forEach((entry) => {
                    if(entry && entry[1]?.length) {
                        res[entry[0]] = entry[1]
                    };
                });
                updatedLen = this.logs.push(res);
                break;
            case "/decrement":
                currentViews = --this.views;
                await this.state.storage.put("views", this.views);
                break;
            case "/get":
                currentLogs = Object.entries(this.logs);
                break;
            default:
                return new Response("Not found", { 
                    status: 404 
                });
        }

        const respData = {
            dayOfYear: getDayOfYear(),
            views: this.views,
            currentLogs: this.logs,
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
function getDayOfYear() {
    let timeSinceEpoch = (Date.now() - Date.parse(new Date().getFullYear(), 0, 0));
    return Math.floor(timeSinceEpoch / 86400000); 
}

// headers: Object.fromEntries(request.headers)
function extractHeaders(request) {
    let res = { timestamp: Date.now(), headers: {} };

    Object.entries(request.cf).forEach((entry) => (
        res.headers[entry[0]] = entry[1]
    ));

    return res; 
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
        let currentLogs = this.logs;
        let updatedLen = this.logs.length; 

        switch (url.pathname) {
            case "/":
                currentViews = ++this.views;
                updatedLen = this.logs.push(extractHeaders(request));
                await this.state.storage.put("views", this.views);
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
    
        return new Response(JSON.stringify(respData, null, 2),  {
            headers: {
            "content-type": "application/json;charset=UTF-8"
            }
        });  
    }
}
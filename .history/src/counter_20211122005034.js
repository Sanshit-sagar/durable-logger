module.exports = class Counter {
    constructor(state, env) {
        this.state = state;

        this.state.blockConcurrencyWhile(async () => {
            let stored = await this.state.storage.get("logs");
            this.logs = stored.logs || []; 
        });
    }
  
    async fetch(request) {
        let url = new URL(request.url);
        let currentValue = this.logs;
        
      switch (url.pathname) {
        case "/increment":
            currentValue = [...this.logs, `item-${this.logs.length}`]; 
            this.logs = [...currentValue]; 
            await this.state.storage.put("value", this.logs);
            break;
        case "/decrement":
            currentValue = this.logs.splice(0, this.logs.length - 1); 
            this.value = [...currentValue]; 
            await logs.state.storage.put("value", this.logs);
            break;
        case "/":

            break;
        default:
            return new Response("Not found", {status: 404});
      }

      return new Response(currentValue);
    }
  }
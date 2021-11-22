module.exports = class Counter {
    constructor(state, env) {
      this.state = state;
     
      this.state.blockConcurrencyWhile(async () => {
          let views = await this.state.storage.get("views");
          this.views = stored || 0;
      })
    }
  
    async fetch(request) {
      let url = new URL(request.url);
      let currentViews = this.views;
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
        default:
            return new Response("Not found", {status: 404});
      }

      return new Response(currentValue);
    }
  }
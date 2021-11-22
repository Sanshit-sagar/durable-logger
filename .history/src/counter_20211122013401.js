module.exports = class Counter {
    constructor(state, env) {
      this.state = state;
     
      this.state.blockConcurrencyWhile(async () => {
          let stored = await this.state.storage.get("value");
          this.value = stored || 0;
      })
    }
  
    async fetch(request) {
      // Apply requested action.
      let url = new URL(request.url);
      let currentValue = this.value;
      switch (url.pathname) {
      case "/increment":
        currentValue = ++this.value;
        await this.state.storage.put("value", this.value);
        break;
      case "/decrement":
        currentValue = --this.value;
        await this.state.storage.put("value", this.value);
        break;
      case "/":

        break;
      default:
        return new Response("Not found", {status: 404});
      }

      return new Response(currentValue);
    }
  }
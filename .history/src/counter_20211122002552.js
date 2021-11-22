module.exports = class Counter {
    constructor(state, env) {
      this.state = state;
      // `blockConcurrencyWhile()` ensures no requests are delivered until
      // initialization completes.
      this.state.blockConcurrencyWhile(async () => {
          let stored = await this.state.storage.get("value");
          this.value = stored || 0;
      })
    }
  
    // Handle HTTP requests from clients.
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
        // Just serve the current value. No storage calls needed!
        break;
      default:
        return new Response("Not found", {status: 404});
      }

      return new Response(currentValue);
    }
  }
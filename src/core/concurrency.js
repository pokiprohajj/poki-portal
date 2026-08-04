// Simple concurrency limiter — bounds the number of simultaneous expensive
// operations (cheerio DOM parsing of large proxied pages). Prevents memory
// spikes under concurrent crawler/game traffic that caused Railway OOM.
function createLimiter(maxConcurrent) {
  let active = 0;
  const queue = [];

  function acquire() {
    return new Promise((resolve) => {
      const run = () => {
        active++;
        resolve(run);
      };
      if (active < maxConcurrent) run();
      else queue.push(run);
    });
  }

  return async function run(task) {
    const release = await acquire();
    try {
      return await task();
    } finally {
      active--;
      if (queue.length > 0) queue.shift()();
    }
  };
}

module.exports = { createLimiter };
import { EventEmitter } from 'events'

export default class Queue extends EventEmitter {
  constructor(maxWaiting, maxConcurrency) {
    super();

    this.jobs = {}; // TODO cleanup old jobs
    this.queue = [];
    this.maxWaiting = maxWaiting;
    this.maxConcurrency = maxConcurrency;
    this.numRunning = 0;
  }

  state() {
    let jobList = [];
    for (let id in this.jobs) {
      jobList.push(this.jobs[id]);
    }
    jobList.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });

    return {
      numWaiting: this.queue.length,
      numRunning: this.numRunning,
      jobs: jobList
    };
  }

  publishState() {
    this.emit('state', this.state());
  }

  enqueue(job) {
    job.on('update', this.publishState.bind(this));
    this.jobs[job.id] = job;
    console.log(`${job.id} queued; token=${job.token}`);
    this.publishState();

    return new Promise((resolve, reject) => {
      if (this.queue.length >= this.maxWaiting) {
        reject(new Error('Queue limit reached'));
        return;
      }

      this.queue.push({
        job: job,
        resolve: resolve,
        reject: reject
      });

      this._dequeue();
    });
  }

  _dequeue() {
    if (this.numRunning >= this.maxConcurrency) {
      return false;
    }

    const item = this.queue.shift();
    if (!item) {
      return false;
    }

    try {
      this.numRunning++;

      console.log(`${item.job.id} start`);
      item.job.run()
        .then((value) => {
          this.numRunning--;
          this.publishState();
          item.resolve(value);
          this._dequeue();
        }, (err) => {
          this.numRunning--;
          this.publishState();
          item.reject(err);
          this._dequeue();
        });
    } catch (err) {
      this.numRunning--;
      this.publishState();
      item.reject(err);
      this._dequeue();
    }
    return true;
  }

  cancel(jobId) {
    let n = -1;

    for (let i in this.queue) {
      if (this.queue[i].job.id == jobId) {
        n = i;
        break;
      }
    }

    if (n >= 0) {
      const job = this.queue[n].job;
      this.queue.splice(n, 1);
      job.canceled(); // TODO callback to the web client
      this.publishState();
      return true;
    } else {
      return false;
    }
  }

  jobStatus(token) {
    let job;
    for (let id in this.jobs) {
      const j = this.jobs[id];
      if (j.token && j.token == token) {
        job = j;
        break;
      }
    }
    if (!job) {
      return null;
    }
    const done = ['success', 'error', 'timeout'].indexOf(job.state) >= 0;
    return {state: job.state, done: done};
  }
}

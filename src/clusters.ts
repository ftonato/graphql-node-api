import * as cluster from 'cluster';
import { CpuInfo, cpus } from 'os';

class Clusters {
  private cpus: CpuInfo[];
  constructor() {
    this.cpus = cpus();
    this.init();
  }

  private init(): void {
    if (cluster.isMaster) {
      this.cpus.forEach(() => cluster.fork());

      clusterConnected();

      clusterDisconnected();

      clusterExited();
    } else {
      require('./index');
    }
  }
}
function clusterConnected() {
  cluster.on('listening', (worker: cluster.Worker) => {
    console.log('Cluster %d connected', worker.process.pid);
  });
}

function clusterDisconnected() {
  cluster.on('disconnect', (worker: cluster.Worker) => {
    console.log('Cluster %d disconnected', worker.process.pid);
  });
}

function clusterExited() {
  cluster.on('exit', (worker: cluster.Worker) => {
    console.log('Cluster %d exited', worker.process.pid);
    cluster.fork();
  });
}

export default new Clusters();

import './styles/index.css';
import { App } from './app/app';
import { LEVELS } from './content/levels';
import { ProgressStore } from './app/progress';
import { browserStorage } from './app/storage';
import { registerServiceWorker } from './app/pwa';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount point');
}

const progress = new ProgressStore(browserStorage(), LEVELS.length);
const app = new App(root, progress);
app.start();
registerServiceWorker();

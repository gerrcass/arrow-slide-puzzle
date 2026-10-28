import './styles/index.css';
import { App } from './app/app';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount point');
}

const app = new App(root);
app.start();

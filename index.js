import { registerKweepeerComponent } from './kweepeer-frontend.js';

const app = () => {
    registerKweepeerComponent();
}

document.addEventListener('DOMContentLoaded', app);

function expand() {
    const kweeper = document.getElementById("kweepeer");
    const query = document.getElementById("q");
    kweepeer.query(query.value);
}

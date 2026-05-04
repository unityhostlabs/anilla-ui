import { AutoInit, Registry, Dropdown } from '../dist/index.js';

AutoInit.registerAll([
    Dropdown
]);

AutoInit.init();

// const dropdown = new Dropdown("#my-menu");

// console.log(dropdown);
// console.log(Registry.getAll());
// console.log(Registry.debug());
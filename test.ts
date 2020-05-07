import { Gene } from "./Gene";

const a = Gene.fromString('RrYYWWss');
const b = Gene.fromString('RrYYWWss');

const results = a.cross(b);
results.forEach(
    (value: [Gene, number]) => {
        console.log(`${value[0]}: ${value[1]}`);
    }
);

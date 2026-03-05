const { RustEngineService } = require('./src/services/rustEngine');

console.log("Generating 1 million random data points...");
const data = new Array(1_000_000);
for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 1000;
}

console.log("Starting K-Means clustering (5 clusters, Max 300 iterations)...");
const startTime = performance.now();

const result = RustEngineService.calculateKMeans(data, 5, 300);

const endTime = performance.now();
console.log(`\nRust Engine execution time: ${((endTime - startTime) / 1000).toFixed(3)} seconds.`);
console.log(`Centers found:`, result.clusters);
console.log(`First 10 Labels: ${result.labels.slice(0, 10)}`);

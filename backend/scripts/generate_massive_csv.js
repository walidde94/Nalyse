const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname, '../../sample_datasets/8_massive_1m_rows.csv');
const rows = 1_000_000; // Change to 5_000_000 for extremely massive testing

console.log(`Generating a massive ${rows.toLocaleString()} row CSV... This might take a few seconds.`);
const stream = fs.createWriteStream(filename);

stream.write('id,date,region,category,sales_agent,revenue,cost\n');

let i = 0;
function write() {
  let ok = true;
  do {
    i++;
    // Generate dates within the last year
    const d = new Date(Date.now() - Math.floor(Math.random() * 3.154e10));
    const dateStr = d.toISOString().split('T')[0];
    
    const region = ['North America', 'Europe', 'APAC', 'LATAM'][Math.floor(Math.random() * 4)];
    const category = ['Software', 'Hardware', 'Services', 'Consulting'][Math.floor(Math.random() * 4)];
    const agent = `Agent_${Math.floor(Math.random() * 50) + 1}`;
    
    // Revenue is random, but we make "Services" structurally higher
    const multiplier = category === 'Services' ? 2 : 1;
    const revenue = (Math.random() * 1000 * multiplier).toFixed(2);
    const cost = (revenue * (Math.random() * 0.5 + 0.2)).toFixed(2); // 20% to 70% cost

    const row = `${i},${dateStr},${region},${category},${agent},${revenue},${cost}\n`;
    
    if (i === rows) {
      stream.write(row, 'utf8', () => {
        console.log(`✅ Done! Successfully created ${filename}.`);
        console.log(`Upload this file in the Nalyse Self-Service Studio to literally watch the Reservoir Sampling algorithm in action inside the Neural Terminal.`);
      });
    } else {
      ok = stream.write(row, 'utf8');
    }
  } while (i < rows && ok);
  
  if (i < rows) {
    stream.once('drain', write);
  }
}

write();

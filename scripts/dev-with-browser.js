const { spawn } = require('child_process');
const { exec } = require('child_process');

// Inicia o servidor Next.js
const nextDev = spawn('npx', ['next', 'dev', '--port', '3000'], {
  stdio: 'inherit',
  shell: true
});

// Aguarda alguns segundos para o servidor iniciar e então abre o navegador
setTimeout(() => {
  const url = 'http://localhost:3000';
  console.log(`\nAbrindo ${url} no navegador...\n`);
  
  // Comando para abrir no navegador padrão do Windows
  exec(`start ${url}`, (error) => {
    if (error) {
      console.error('Erro ao abrir o navegador:', error);
    }
  });
}, 3000); // Aguarda 3 segundos

// Passa os sinais de interrupção para o processo Next.js
process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
  process.exit();
});


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
  try {
    exec(`start ${url}`, (error) => {
      if (error) {
        // Ignorar EPERM em ambientes restritos
        if (error.code !== 'EPERM') {
          console.error('Erro ao abrir o navegador:', error);
        }
      }
    });
  } catch (error) {
    if (error && error.code !== 'EPERM') {
      console.error('Erro ao abrir o navegador:', error);
    }
  }
}, 3000); // Aguarda 3 segundos

// Passa os sinais de interrupção para o processo Next.js
process.on('SIGINT', () => {
  try {
    nextDev.kill('SIGINT');
  } catch (error) {
    // Ignorar erros de kill no Windows (EPERM)
    if (error.code !== 'EPERM') {
      console.error('Erro ao encerrar processo:', error);
    }
  }
  process.exit();
});

process.on('SIGTERM', () => {
  try {
    nextDev.kill('SIGTERM');
  } catch (error) {
    // Ignorar erros de kill no Windows (EPERM)
    if (error.code !== 'EPERM') {
      console.error('Erro ao encerrar processo:', error);
    }
  }
  process.exit();
});

// Tratar erros não capturados do processo filho
nextDev.on('error', (error) => {
  // Ignorar erros EPERM no Windows
  if (error.code === 'EPERM') {
    return;
  }
  console.error('Erro no processo Next.js:', error);
});;


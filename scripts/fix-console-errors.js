const fs = require('fs');
const path = require('path');

// Função para encontrar todos os arquivos .tsx e .ts
function findFiles(dir, extensions = ['.tsx', '.ts']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Pular node_modules e .next
      if (file !== 'node_modules' && file !== '.next' && !file.startsWith('.')) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Função para corrigir console.error em um arquivo
function fixConsoleErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Verificar se o arquivo já importa getErrorMessage
    const hasImport = content.includes("import { getErrorMessage } from '@/lib/error-handler'");
    
    // Padrões para console.error com objeto error
    const patterns = [
      // console.error('mensagem:', error)
      /console\.error\(([^,]+),\s*error\)/g,
      // console.error('mensagem:', error instanceof Error ? error.message : String(error))
      /console\.error\(([^,]+),\s*error instanceof Error \? error\.message : String\(error\)\)/g,
    ];
    
    // Aplicar correções
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern, (match, message) => {
        modified = true;
        return `console.error(${message}, getErrorMessage(error))`;
      });
      content = newContent;
    });
    
    // Adicionar import se necessário e se houve modificações
    if (modified && !hasImport) {
      // Encontrar a última linha de import
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
      if (importLines.length > 0) {
        const lastImportLine = importLines[importLines.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImportLine);
        const insertIndex = lastImportIndex + lastImportLine.length;
        
        content = content.slice(0, insertIndex) + 
                 "\nimport { getErrorMessage } from '@/lib/error-handler';" + 
                 content.slice(insertIndex);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
function main() {
  console.log('🔍 Procurando arquivos com console.error...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  let fixedCount = 0;
  let totalFiles = 0;
  
  files.forEach(file => {
    totalFiles++;
    if (fixConsoleErrors(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n📊 Resumo:`);
  console.log(`   Arquivos processados: ${totalFiles}`);
  console.log(`   Arquivos corrigidos: ${fixedCount}`);
  console.log(`   Arquivos sem alterações: ${totalFiles - fixedCount}`);
}

if (require.main === module) {
  main();
}

module.exports = { fixConsoleErrors, findFiles };

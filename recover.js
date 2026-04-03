const fs = require('fs');
const path = require('path');
const os = require('os');

const baseDirs = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'History'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'History'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'Code - Insiders', 'User', 'History')
];

let targetFile = 'PropertySettings_V2.jsx';

function findFile(dir) {
    let bestMatch = null;
    if (!fs.existsSync(dir)) {
        return null;
    }

    const subDirs = fs.readdirSync(dir);
    for (const subDir of subDirs) {
        const fullPath = path.join(dir, subDir);
        if (fs.statSync(fullPath).isDirectory()) {
            const entriesPath = path.join(fullPath, 'entries.json');
            if (fs.existsSync(entriesPath)) {
                try {
                    const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
                    if (entries.resource && entries.resource.endsWith(targetFile)) {
                        for (const entry of entries.entries) {
                            const entryFile = path.join(fullPath, entry.id);
                            if (fs.existsSync(entryFile)) {
                                const stats = fs.statSync(entryFile);
                                // Si es mayor de 20KB, es casi seguro nuestro componente original de 900 líneas
                                if (stats.size > 20000 && (!bestMatch || stats.mtimeMs > bestMatch.time)) {
                                    bestMatch = { file: entryFile, time: stats.mtimeMs, size: stats.size };
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Ignorar
                }
            }
        }
    }
    return bestMatch;
}

let match = null;
let foundDir = false;

for (const dir of baseDirs) {
    if (fs.existsSync(dir)) {
        foundDir = true;
        const currentMatch = findFile(dir);
        if (currentMatch) {
            if (!match || currentMatch.time > match.time) {
                match = currentMatch;
            }
        }
    }
}

if (!foundDir) {
    console.log("❌ No se encontró la carpeta de historial de VS Code, ni de Cursor.");
} else if (match) {
    console.log("✅ ¡ENCONTRADO RESPALDO AUTOMÁTICO EN EL HISTORIAL!");
    console.log(`- Tamaño: ${(match.size / 1024).toFixed(2)} KB (El panel original de 900+ líneas)`);
    
    const content = fs.readFileSync(match.file, 'utf8');
    const targetPath = path.join(__dirname, 'frontend', 'src', 'components', 'PropertySettings_V2.jsx');
    fs.writeFileSync(targetPath, content);
    
    console.log("✅ ¡Archivo restaurado con éxito! Vuelve a tu editor y mira la magia.");
} else {
    console.log("❌ No se pudo encontrar un respaldo mayor a 20KB en el Historial reciente.");
}

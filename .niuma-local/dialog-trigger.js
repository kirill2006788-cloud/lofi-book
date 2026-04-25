#!/usr/bin/env node
/**
 * Нюма Режим — Скрипт вызова диалога (локальная версия)
 * Кроссплатформенный: Windows/Mac/Linux
 *
 * Использование: node dialog-trigger.js --port PORT "Описание работы AI"
 *
 * Поток: подключается к HTTP серверу расширения по указанному порту
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

// Локальный каталог — в текущем проекте
const niumaDir = path.join(process.cwd(), '.niuma-local');

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return null;
}

// Разбор аргументов
const portArg = getArgValue('--port');
const workspaceKeyArg = getArgValue('--workspaceKey');

// Фильтруем флаги, получаем summary
const filteredArgs = process.argv.slice(2).filter((a, i, arr) => {
  if (a === '--port' || a === '--workspaceKey') return false;
  if (i > 0 && (arr[i-1] === '--port' || arr[i-1] === '--workspaceKey')) return false;
  return true;
});
const summary = filteredArgs.join(' ').trim() || 'AI завершил задачу.';

// Служебная фраза из старых .windsurfrules не должна уходить в диалог как «резюме».
function normalizeSummary(input) {
  const text = String(input || '').trim();
  if (!text) return 'AI завершил задачу.';
  if (text === 'Описание выполненной работы') return 'AI завершил задачу.';
  if (text === '<ПОЛНЫЙ_ОТВЕТ_ПОЛЬЗОВАТЕЛЮ_В_MARKDOWN>') return 'AI завершил задачу.';
  return text;
}
const effectiveSummary = normalizeSummary(summary);

// Вывод ответа (запись в файл + вывод в терминал)
function outputResponse(response) {
  const action = response.action || 'unknown';
  const feedback = response.feedback || '';

  // Путь к файлу ответа (в локальном каталоге проекта)
  const responseFile = path.join(niumaDir, 'last_response.md');

  // Формируем Markdown-содержимое
  let fileContent = `# 🐴 Нюма Режим — Ответ пользователя\n\n`;
  fileContent += `> Время: ${new Date().toLocaleString('ru-RU')}\n\n`;
  fileContent += `## ACTION\n\n`;
  fileContent += `\`\`\`\n${action}\n\`\`\`\n\n`;

  if (feedback.trim()) {
    fileContent += `## ⚠️ Инструкции пользователя (обязательно выполнить)\n\n`;
    fileContent += `\`\`\`\n${feedback}\n\`\`\`\n\n`;
    fileContent += `**Важно**: строго следуйте инструкциям выше!\n\n`;
  } else {
    fileContent += `## Инструкции пользователя\n\n`;
    fileContent += `(Пользователь не ввёл дополнительных инструкций, продолжайте текущую задачу)\n\n`;
  }

  if (response.images && response.images.length > 0) {
    fileContent += `## 📷 Загруженные изображения\n\n`;
    response.images.forEach((img, i) => {
      fileContent += `- Изображение ${i + 1}: \`${img}\`\n`;
    });
    fileContent += `\nИспользуйте read_file для просмотра.\n\n`;
  }

  if (response.files && response.files.length > 0) {
    fileContent += `## 📄 Файлы пользователя\n\n`;
    for (const file of response.files) {
      fileContent += `### ${file.name}\n\n`;
      fileContent += `\`\`\`\n${file.content || '(пусто)'}\n\`\`\`\n\n`;
    }
  }

  fileContent += `---\n\n`;
  if (action === 'continue') {
    fileContent += `## ✅ Следующий шаг\n\n`;
    fileContent += `1. Выполните инструкции пользователя выше\n`;
    fileContent += `2. По завершении снова вызовите команду диалога\n`;
  } else {
    fileContent += `## 🛑 Диалог завершён\n\n`;
    fileContent += `Пользователь выбрал завершение. Немедленно прекратите работу.\n`;
  }
  
  // Запись в файл
  try {
    if (!fs.existsSync(niumaDir)) {
      fs.mkdirSync(niumaDir, { recursive: true });
    }
    fs.writeFileSync(responseFile, fileContent, 'utf8');
  }catch (e) {
    console.error('[Нюма] Ошибка записи файла ответа:', e.message);
  }
  
  // Вывод в терминал (краткая версия + путь к файлу)
  console.log('');
  console.log('🚨🚨🚨 Нюма Режим — ответ получен 🚨🚨🚨');
  console.log('');
  console.log('ACTION:', action);
  console.log('');

  // Указание AI прочитать файл
  console.log('📄 Полный ответ сохранён в файл, прочитайте:');
  console.log('');
  console.log(`    read_file "${responseFile.replace(/\\/g, '/')}"`);
  console.log('');

  // Предпросмотр в терминале
  if (feedback.trim()) {
    console.log('--- ПРЕДПРОСМОТР ---');
    console.log(feedback);
    console.log('--- КОНЕЦ ---');
  }

  console.log('');
  if (action === 'continue') {
    console.log('✅ Пользователь выбрал【Продолжить】');
    console.log('⚠️ Сначала прочитайте файл выше для полных инструкций!');
  } else {
    console.log('🛑 Пользователь выбрал【Завершить】— немедленно остановитесь');
  }
  console.log('');
  console.log('🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨');
}

// HTTP режим: прямой запрос к серверу расширения
function triggerViaHttp(port) {
  const url = `http://127.0.0.1:${port}/trigger`;
  const payload = JSON.stringify({ type: 'dialog', summary: effectiveSummary });

  console.log('[Нюма] Подключение к серверу расширения...');

  const req = http.request(url, {
    method: 'POST',
    timeout: 0, // Бесконечное ожидание — пока пользователь не ответит
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload, 'utf8')
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.error) {
          console.error('[Нюма] Ошибка сервиса:', response.error);
          console.log('ACTION: error');
          process.exit(1);
        }
        outputResponse(response);
        process.exit(0);
      }catch (e) {
        console.error('[Нюма] Ошибка разбора ответа:', e.message);
        console.log('ACTION: error');
        process.exit(1);
      }
    });
  });

  req.write(payload);
  req.end();

  req.on('error', (e) => {
    console.error('[Нюма] Ошибка подключения:', e.message);
    console.log('ACTION: error');
    console.log('FEEDBACK: Убедитесь, что VS Code открыт и расширение Нюма Режим активно');
    process.exit(1);
  });
}

// Основная логика: чтение порта и подключение
const cwd = String(process.cwd()).toLowerCase().replace(/\\/g, '/');
const workspaceKey = workspaceKeyArg || crypto.createHash('sha1').update(cwd).digest('hex').slice(0, 10);

if (portArg) {
  // 1. Приоритет — порт из командной строки
  triggerViaHttp(parseInt(portArg, 10));
} else {
  // 2. Попытка найти порт из файла в .niuma-local
  const portFile = path.join(niumaDir, `port_${workspaceKey}.txt`);
  
  if (fs.existsSync(portFile)) {
    try {
      const portValue = fs.readFileSync(portFile, 'utf8').trim();
      const port = parseInt(portValue, 10);
      if (port > 0) {
        triggerViaHttp(port);
      } else {
        console.log('ACTION: error');
        console.log('FEEDBACK: Некорректный порт, перезагрузите VS Code');
        process.exit(1);
      }
    } catch (e) {
      console.log('ACTION: error');
      console.log('FEEDBACK: Ошибка чтения информации о порте');
      process.exit(1);
    }
  }else {
    // 3. Файл порта не найден
    console.log('ACTION: error');
    console.log('FEEDBACK: Не найден файл порта. Убедитесь: 1) VS Code открыт 2) Расширение Нюма активно 3) В .windsurfrules указан --port');
    process.exit(1);
  }
}

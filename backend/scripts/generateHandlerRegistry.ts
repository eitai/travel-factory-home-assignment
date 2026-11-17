import { readFileSync, writeFileSync } from 'node:fs';
import { generateHandlerRegistry } from 'commoneventframework/dist/script/generateHandlerRegistry';

const ROUTES_FILE = 'src/root.yaml';
const REGISTRY_FILE = 'src/generated/HandlerRegistry.ts';

generateHandlerRegistry({ rootYaml: ROUTES_FILE, outFile: REGISTRY_FILE });

const generatedLines = readFileSync(REGISTRY_FILE, 'utf8').split('\n');
const codeLines = generatedLines.filter((line) => !/^\s*(\/\/|\/\*)/.test(line));
writeFileSync(REGISTRY_FILE, codeLines.join('\n').trimStart());

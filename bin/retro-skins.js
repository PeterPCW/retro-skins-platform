#!/usr/bin/env node
// Retro Skins Platform CLI Entry Point

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '..', 'dist', 'cli.js');

import(cliPath);

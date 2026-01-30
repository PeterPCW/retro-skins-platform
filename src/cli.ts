#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import { PRESET_SKINS } from './engine/skins.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWezTermLua } from './engine/adapters/wezterm/index.js';
import { generateAlacrittyYaml } from './engine/adapters/alacritty/index.js';
import { generateKittyConfig } from './engine/adapters/kitty/index.js';
import { generateWindowsTerminalJson } from './engine/adapters/windows-terminal/index.js';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const program = new Command();

const VALID_TERMINALS = ['wezterm', 'alacritty', 'kitty', 'windows-terminal'];

program
  .name('retro-skins')
  .description('Generate retro terminal skins with CRT effects')
  .version('1.0.0');

program
  .command('list')
  .description('List all available retro skins')
  .action(() => {
    console.log('\n🎨 Available Skins:\n');
    Object.entries(PRESET_SKINS).forEach(([name, skinFn]) => {
      const skin = skinFn();
      console.log(`  • ${name.padEnd(10)} ${skin.name}`);
    });
    console.log('\n📝 Use: retro-skins preview <skin-name>');
    console.log('');
  });

program
  .command('preview [skin]')
  .description('Preview a skin configuration (shows all if no name given)')
  .option('-t, --terminal <type>', 'Preview for specific terminal (wezterm, alacritty, kitty, windows-terminal)')
  .option('--dry-run', 'Preview without generating output')
  .action((skinName, options) => {
    if (skinName) {
      // Preview specific skin
      const skinFn = PRESET_SKINS[skinName];
      if (!skinFn) {
        console.error(`❌ Unknown skin: ${skinName}`);
        console.log(`   Available: ${Object.keys(PRESET_SKINS).join(', ')}`);
        process.exit(1);
      }
      const skin = skinFn();
      console.log(`\n🎨 ${skin.name} (${skinName})`);
      console.log('   Colors:');
      console.log(`     Background: ${skin.colors.background}`);
      console.log(`     Foreground: ${skin.colors.foreground}`);
      console.log(`     Accent:     ${skin.colors.accent}`);
      console.log(`     Glow:       ${skin.colors.glow}`);
      console.log(`   Effects: ${skin.effects.map(e => e.type).join(', ')}`);
      if (options.terminal) {
        console.log(`\n📄 ${options.terminal.toUpperCase()} Preview:`);
        console.log('─'.repeat(40));
        const terminal = options.terminal.toLowerCase();
        let config: string;
        if (terminal === 'wezterm') config = generateWezTermLua(skin);
        else if (terminal === 'alacritty') config = generateAlacrittyYaml(skin);
        else if (terminal === 'windows-terminal') config = generateWindowsTerminalJson(skin);
        else config = generateKittyConfig(skin);
        console.log(config);
      }
    } else {
      // List all skins with details
      console.log('\n🎨 All Skins Preview:\n');
      Object.entries(PRESET_SKINS).forEach(([name, skinFn]) => {
        const skin = skinFn();
        console.log(`  ${name}:`);
        console.log(`    Name:      ${skin.name}`);
        console.log(`    Colors:    ${skin.colors.background} → ${skin.colors.foreground}`);
        console.log(`    Effects:   ${skin.effects.length} active`);
      });
    }
    console.log('');
  });

program
  .command('apply <terminal>')
  .description('Interactive: apply a skin to your terminal')
  .option('-o, --output <file>', 'Output file path (stdout if not specified)')
  .action(async (terminal, options) => {
    if (!VALID_TERMINALS.includes(terminal.toLowerCase())) {
      console.error(`❌ Invalid terminal: ${terminal}`);
      console.log(`   Valid options: ${VALID_TERMINALS.join(', ')}`);
      process.exit(1);
    }

    const skinNames = Object.keys(PRESET_SKINS);
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'skin',
        message: 'Choose a skin:',
        choices: skinNames,
      },
    ]);

    const selectedSkinFn = PRESET_SKINS[answers.skin];
    const skinConfig = selectedSkinFn();
    const terminalType = terminal.toLowerCase();
    
    let config: string;
    
    if (terminalType === 'wezterm') {
      config = generateWezTermLua(skinConfig);
      config = `// WezTerm config - copy to ~/.config/wezterm/retro_skin.lua\n\n${config}`;
    } else if (terminalType === 'alacritty') {
      config = generateAlacrittyYaml(skinConfig);
      config = `# Alacritty config - copy to ~/.config/alacritty/retro_skin.yml\n\n${config}`;
    } else if (terminalType === 'windows-terminal') {
      config = generateWindowsTerminalJson(skinConfig);
      config = `// Windows Terminal config - add scheme to settings.json\n\n${config}`;
    } else {
      config = generateKittyConfig(skinConfig);
      config = `# Kitty config - copy to ~/.config/kitty/retro_skin.conf\n\n${config}`;
    }

    if (options.output) {
      const outputPath = join(process.cwd(), options.output);
      fs.writeFileSync(outputPath, config);
      console.log(`✅ Config written to ${outputPath}`);
    } else {
      console.log('\n📄 Generated Config:\n');
      console.log(config);
    }
  });

program
  .command('generate <terminal> <skin>')
  .description('Generate terminal config for a skin (non-interactive)')
  .option('-o, --output <file>', 'Output file path (stdout if not specified)')
  .option('--dry-run', 'Preview without writing files')
  .action((terminal, skinName, options) => {
    if (!VALID_TERMINALS.includes(terminal.toLowerCase())) {
      console.error(`❌ Invalid terminal: ${terminal}`);
      console.log(`   Valid options: ${VALID_TERMINALS.join(', ')}`);
      process.exit(1);
    }

    const skinFn = PRESET_SKINS[skinName];
    if (!skinFn) {
      console.error(`❌ Unknown skin: ${skinName}`);
      console.log(`   Available: ${Object.keys(PRESET_SKINS).join(', ')}`);
      process.exit(1);
    }

    const skinConfig = skinFn();
    const terminalType = terminal.toLowerCase();
    
    let config: string;
    if (terminalType === 'wezterm') {
      config = generateWezTermLua(skinConfig);
    } else if (terminalType === 'alacritty') {
      config = generateAlacrittyYaml(skinConfig);
    } else if (terminalType === 'windows-terminal') {
      config = generateWindowsTerminalJson(skinConfig);
    } else {
      config = generateKittyConfig(skinConfig);
    }
    
    if (options.dryRun) {
      console.log(`\n🔍 Dry Run - ${terminal.toUpperCase()} config for "${skinConfig.name}":\n`);
      console.log(config);
      console.log('\n✅ Would output to: ' + (options.output || 'stdout'));
    } else if (options.output) {
      const outputPath = options.output.startsWith('/') 
        ? options.output 
        : join(process.cwd(), options.output);
      fs.writeFileSync(outputPath, config);
      console.log(`✅ Config written to ${outputPath}`);
    } else {
      console.log(config);
    }
  });

program.parse();

// Add help on no arguments
if (process.argv.length === 2) {
  program.help();
}

/**
 * Integration Tests for Retro Skins Platform CLI
 * Tests all three terminal adapters: WezTerm, Alacritty, Kitty
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const projectRoot = path.resolve(__dirname, '..');
const cliPath = path.join(projectRoot, 'bin', 'retro-skins.js');

describe('Retro Skins Platform CLI Integration Tests', () => {
  describe('List Command', () => {
    it('should list all available skins', async () => {
      const { stdout } = await execAsync(`node ${cliPath} list`);
      expect(stdout).toContain('Available Skins');
      expect(stdout).toContain('phosphor');
      expect(stdout).toContain('amber');
      expect(stdout).toContain('lcd');
      expect(stdout).toContain('cyber');
      expect(stdout).toContain('terminal');
    });
  });

  describe('Preview Command', () => {
    it('should preview a specific skin', async () => {
      const { stdout } = await execAsync(`node ${cliPath} preview phosphor`);
      expect(stdout).toContain('Phosphor CRT');
      expect(stdout).toContain('Background');
      expect(stdout).toContain('Foreground');
    });

    it('should preview all skins when no name given', async () => {
      const { stdout } = await execAsync(`node ${cliPath} preview`);
      expect(stdout).toContain('All Skins Preview');
      expect(stdout).toContain('phosphor');
      expect(stdout).toContain('amber');
    });

    it('should preview for specific terminal', async () => {
      const { stdout } = await execAsync(`node ${cliPath} preview phosphor --terminal wezterm`);
      expect(stdout).toContain('WEZTERM');
      expect(stdout).toContain('Retro Skin');
    });

    it('should show error for unknown skin', async () => {
      try {
        await execAsync(`node ${cliPath} preview unknown_skin`);
      } catch (e: any) {
        expect(e.stderr).toContain('Unknown skin');
        return;
      }
      throw new Error('Expected command to fail');
    });
  });

  describe('Generate Command', () => {
    it('should generate WezTerm config', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate wezterm phosphor`);
      expect(stdout).toContain('Retro Skin');
      expect(stdout).toContain('local wezterm');
      expect(stdout).toContain('ansi');
    });

    it('should generate Alacritty config', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate alacritty amber`);
      expect(stdout).toContain('Retro Skin');
      expect(stdout).toContain('colors:');
      expect(stdout).toContain('primary:');
    });

    it('should generate Kitty config', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate kitty lcd`);
      expect(stdout).toContain('Retro Skin');
      expect(stdout).toContain('foreground');
      expect(stdout).toContain('background');
    });

    it('should output to file with --output flag', async () => {
      const outputFile = path.join(projectRoot, 'tests', 'output-test.lua');
      await execAsync(`node ${cliPath} generate wezterm phosphor --output ${outputFile}`);
      
      expect(fs.existsSync(outputFile)).toBe(true);
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('Retro Skin');
      expect(content).toContain('local wezterm');
      
      fs.unlinkSync(outputFile);
    });

    it('should support --dry-run flag', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate wezterm phosphor --dry-run`);
      expect(stdout).toContain('Dry Run');
      expect(stdout).toContain('stdout');
    });

    it('should show error for invalid terminal', async () => {
      try {
        await execAsync(`node ${cliPath} generate invalid phosphor`);
      } catch (e: any) {
        expect(e.stderr).toContain('Invalid terminal');
        return;
      }
      throw new Error('Expected command to fail');
    });

    it('should show error for unknown skin', async () => {
      try {
        await execAsync(`node ${cliPath} generate wezterm unknown`);
      } catch (e: any) {
        expect(e.stderr).toContain('Unknown skin');
        return;
      }
      throw new Error('Expected command to fail');
    });
  });

  describe('Apply Command', () => {
    it('should show help for apply command', async () => {
      const { stdout } = await execAsync(`node ${cliPath} apply --help`);
      expect(stdout).toContain('Interactive');
    });
  });

  describe('Terminal-Specific Tests', () => {
    it('should generate valid WezTerm Lua syntax', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate wezterm cyber`);
      expect(stdout).toContain("local colors = {");
      expect(stdout).toContain("ansi = {");
      expect(stdout).toContain("return config");
    });

    it('should generate valid Alacritty YAML syntax', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate alacritty terminal`);
      expect(stdout).toContain("colors:");
      expect(stdout).toContain("primary:");
      expect(stdout).toContain("background:");
    });

    it('should generate valid Kitty config syntax', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate kitty cyber`);
      expect(stdout).toMatch(/foreground #/);
      expect(stdout).toMatch(/background #/);
      expect(stdout).toContain("color0");
    });

    it('should include all ANSI colors for each terminal', async () => {
      // WezTerm
      let { stdout } = await execAsync(`node ${cliPath} generate wezterm phosphor`);
      expect(stdout).toContain("ansi = {");

      // Alacritty
      ({ stdout } = await execAsync(`node ${cliPath} generate alacritty phosphor`));
      expect(stdout).toContain("normal:");

      // Kitty
      ({ stdout } = await execAsync(`node ${cliPath} generate kitty phosphor`));
      expect(stdout).toContain("color0");
    });
  });

  describe('All Skins Work', () => {
    const skins = ['phosphor', 'amber', 'lcd', 'cyber', 'terminal', 'puncore'];
    const terminals = ['wezterm', 'alacritty', 'kitty'];

    for (const skin of skins) {
      for (const terminal of terminals) {
        it(`should generate ${skin} for ${terminal}`, async () => {
          const { stdout } = await execAsync(
            `node ${cliPath} generate ${terminal} ${skin}`
          );
          expect(stdout).toContain('Retro Skin');
        });
      }
    }
  });

  describe('Windows Terminal Tests', () => {
    it('should generate Windows Terminal JSON config', async () => {
      const { stdout } = await execAsync(`node ${cliPath} generate windows-terminal phosphor`);
      expect(stdout).toContain('Retro Skin');
      expect(stdout).toContain('"schemes"');
      expect(stdout).toContain('"background"');
      expect(stdout).toContain('"foreground"');
    });

    it('should generate all skins for Windows Terminal', async () => {
      const skins = ['phosphor', 'amber', 'lcd', 'cyber', 'terminal', 'puncore'];
      for (const skin of skins) {
        const { stdout } = await execAsync(`node ${cliPath} generate windows-terminal ${skin}`);
        expect(stdout).toContain('Retro Skin');
        expect(stdout).toContain('"schemes"');
      }
    });
  });
});

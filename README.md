# Retro Skins Platform

Generate retro terminal skins with CRT effects, scanlines, glow, and more. Supports **WezTerm**, **Alacritty**, **Kitty**, and **Windows Terminal** terminal emulators.

[![NPM Package](https://img.shields.io/npm/v/retro-skins-platform.svg)](https://www.npmjs.com/package/retro-skins-platform)
[![License](https://img.shields.io/npm/l/retro-skins-platform.svg)](LICENSE)

## Installation

```bash
# Clone and install dependencies
cd retro-skins-platform
pnpm install

# Build the project
pnpm build

# Link globally (optional)
pnpm link --global
```

## CLI Commands

### `retro-skins list`

List all available retro skins.

```bash
retro-skins list
```

**Output:**
```
🎨 Available Skins:

  • phosphor    Phosphor CRT
  • amber       Amber Monochrome
  • lcd         LCD Display
  • cyber       Cyber Purple
  • terminal    Classic Terminal

📝 Use: retro-skins preview <skin-name>
```

---

### `retro-skins preview [skin]`

Preview a skin configuration. Shows all skins if no name given.

```bash
# Preview specific skin
retro-skins preview phosphor

# Preview all skins
retro-skins preview

# Preview with terminal-specific config
retro-skins preview phosphor --terminal wezterm
```

**Options:**
| Option | Description |
|--------|-------------|
| `-t, --terminal <type>` | Preview for specific terminal (wezterm, alacritty, kitty, windows-terminal) |

---

### `retro-skins generate <terminal> <skin>`

Generate terminal configuration directly (non-interactive).

```bash
# Generate to stdout
retro-skins generate wezterm phosphor
retro-skins generate alacritty amber
retro-skins generate kitty lcd

# Generate to file
retro-skins generate wezterm phosphor --output ~/.config/wezterm/retro_skin.lua
retro-skins generate alacritty cyber --output ~/retro-alacritty.yml
retro-skins generate kitty terminal --output ~/.config/kitty/retro_skin.conf

# Dry run (preview without writing)
retro-skins generate wezterm phosphor --dry-run
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `terminal` | Target terminal (wezterm, alacritty, kitty, windows-terminal) |
| `skin` | Skin name (phosphor, amber, lcd, cyber, terminal, puncore) |

**Options:**
| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Write to file instead of stdout |
| `--dry-run` | Preview without writing files |

---

### `retro-skins apply <terminal>`

Interactive command to apply a skin to your terminal.

```bash
# Interactive mode (prompts for skin selection)
retro-skins apply wezterm

# With output file
retro-skins apply alacritty --output ~/.config/alacritty/retro_skin.yml
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `terminal` | Target terminal (wezterm, alacritty, kitty, windows-terminal) |

**Options:**
| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Write to file instead of stdout |

---

## Available Skins

| Name | Description | Colors |
|------|-------------|--------|
| `phosphor` | Classic green phosphor CRT | #0D0208 → #00FF41 |
| `amber` | Amber monochrome display | #1A0F00 → #FFB000 |
| `lcd` | Clean LCD display style | #0A0A0A → #E8E8E8 |
| `cyber` | Purple cyberpunk aesthetic | #0D0D1A → #B388FF |
| `terminal` | Classic blue terminal | #0C0C14 → #4AF626 |
| `puncore` | Neon theme | #575757 → #858585 |

---

## Usage Flow

```bash
# 1. List available skins
retro-skins list

# 2. Preview a skin
retro-skins preview phosphor

# 3. Preview terminal-specific output
retro-skins preview phosphor --terminal wezterm

# 4. Generate final config
retro-skins generate wezterm phosphor --output ~/.config/wezterm/retro_skin.lua
```

---

## Installation Locations

After generating configs, place them in:

| Terminal | Location |
|----------|----------|
| WezTerm | `~/.config/wezterm/retro_skin.lua` |
| Alacritty | `~/.config/alacritty/retro_skin.yml` |
| Kitty | `~/.config/kitty/retro_skin.conf` |

---

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Watch mode
pnpm dev
```

---

## Testing

Run integration tests for all three terminals:

```bash
pnpm test
```

Tests cover:
- ✅ List command
- ✅ Preview command (all skins + terminal-specific)
- ✅ Generate command (all terminal/skin combinations)
- ✅ File output with `--output` flag
- ✅ Dry-run with `--dry-run` flag
- ✅ Valid syntax for WezTerm Lua, Alacritty YAML, and Kitty config

---

## License

MIT

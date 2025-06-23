#!/usr/bin/env node

/**
 * Auto-completion support for REST-SPEC CLI commands
 *
 * This module provides bash and zsh auto-completion for REST-SPEC CLI tools.
 * It can be installed globally or sourced directly in shell configuration.
 *
 * @author REST-Base Team
 */

const fs = require("fs");
const path = require("path");

/**
 * CLI Commands and their options
 */
const CLI_COMMANDS = {
  "create-project": {
    options: [
      "--dry-run",
      "-d",
      "--interactive",
      "-i",
      "--config",
      "-c",
      "--verbose",
      "-v",
      "--template",
      "-t",
      "--no-backup",
      "--force",
      "-f",
      "--help",
      "-h",
    ],
    templates: [
      "default",
      "microservice",
      "api-gateway",
      "graphql",
      "websocket",
    ],
    description: "Create a new REST API project with standards",
  },
  "setup-standards": {
    options: [
      "--dry-run",
      "-d",
      "--interactive",
      "-i",
      "--config",
      "-c",
      "--verbose",
      "-v",
      "--rollback",
      "-r",
      "--no-backup",
      "--force",
      "-f",
      "--help",
      "-h",
    ],
    description: "Apply REST-SPEC standards to existing project",
  },
};

/**
 * Generate bash completion script
 * @returns {string} Bash completion script
 */
function generateBashCompletion() {
  /* eslint-disable */
  return `#!/bin/bash

# REST-SPEC CLI Auto-completion for Bash
# Add this to your ~/.bashrc or ~/.bash_profile:
# source /path/to/rest-spec-completion.bash

_rest_spec_completions() {
    local cur prev opts commands
    COMPREPLY=()
    cur="\\${COMP_WORDS[COMP_CWORD]}"
    prev="\\${COMP_WORDS[COMP_CWORD - 1]}"
    
    # Available commands
    commands="create-project setup-standards"
    
    # Command-specific options
    create_project_opts="--dry-run -d --interactive -i --config -c --verbose -v --template -t --no-backup --force -f --help -h"
    setup_standards_opts="--dry-run -d --interactive -i --config -c --verbose -v --rollback -r --no-backup --force -f --help -h"
    
    # Template options
    templates="default microservice api-gateway graphql websocket"
    
    # If we're completing the first argument (command)
    if [[ \\${COMP_CWORD} == 1 ]]; then
        COMPREPLY=($(compgen -W "\\${commands}" -- \\${cur}))
        return 0
    fi
    
    # Get the command being used
    local command="\\${COMP_WORDS[1]}"
    
    # Handle template completion for --template option
    if [[ "\\$prev" == "--template" || "\\$prev" == "-t" ]]; then
        COMPREPLY=($(compgen -W "\\${templates}" -- \\${cur}))
        return 0
    fi
    
    # Handle config file completion for --config option
    if [[ "\\$prev" == "--config" || "\\$prev" == "-c" ]]; then
        COMPREPLY=($(compgen -f -X '!*.json' -- \\${cur}))
        return 0
    fi
    
    # Handle directory completion for setup-standards
    if [[ "\\$command" == "setup-standards" && "\\$cur" != -* ]]; then
        COMPREPLY=($(compgen -d -- \\${cur}))
        return 0
    fi
    
    # Handle project name completion for create-project (no completion, just allow typing)
    if [[ "\\$command" == "create-project" && "\\$cur" != -* ]]; then
        return 0
    fi
    
    # Complete with command-specific options
    case "\\$command" in
        create-project)
            COMPREPLY=($(compgen -W "\\${create_project_opts}" -- \\${cur}))
            ;;
        setup-standards)
            COMPREPLY=($(compgen -W "\\${setup_standards_opts}" -- \\${cur}))
            ;;
        *)
            COMPREPLY=($(compgen -W "\\${commands}" -- \\${cur}))
            ;;
    esac
}

# Register completion for different command names
complete -F _rest_spec_completions create-project
complete -F _rest_spec_completions setup-standards
complete -F _rest_spec_completions rest-spec-create
complete -F _rest_spec_completions rest-spec-setup

# If running node scripts directly
complete -F _rest_spec_completions node
`;
  /* eslint-enable */
}

/**
 * Generate zsh completion script
 * @returns {string} Zsh completion script
 */
function generateZshCompletion() {
  return `#compdef create-project setup-standards rest-spec-create rest-spec-setup

# REST-SPEC CLI Auto-completion for Zsh
# Add this to your ~/.zshrc:
# fpath=(~/.zsh/completions $fpath)
# autoload -U compinit && compinit

_rest_spec_commands() {
    local context state line
    typeset -A opt_args
    
    local commands=(
        'create-project:Create a new REST API project with standards'
        'setup-standards:Apply REST-SPEC standards to existing project'
    )
    
    local global_opts=(
        '(-d --dry-run)'{-d,--dry-run}'[Run in dry-run mode (preview changes)]'
        '(-i --interactive)'{-i,--interactive}'[Run in interactive mode]'
        '(-c --config)'{-c,--config}'[Use configuration file]:config file:_files -g "*.json"'
        '(-v --verbose)'{-v,--verbose}'[Enable verbose logging]'
        '--no-backup[Skip creating backups]'
        '(-f --force)'{-f,--force}'[Force operation without prompts]'
        '(-h --help)'{-h,--help}'[Show help message]'
    )
    
    _arguments -C \
        '1:command:->commands' \
        '*::arg:->args' && return 0
    
    case $state in
        commands)
            _describe 'REST-SPEC commands' commands
            ;;
        args)
            case $words[1] in
                create-project)
                    _rest_spec_create_project
                    ;;
                setup-standards)
                    _rest_spec_setup_standards
                    ;;
            esac
            ;;
    esac
}

_rest_spec_create_project() {
    local templates=(
        'default:Standard REST API with Express.js'
        'microservice:Microservice architecture with message queuing'
        'api-gateway:API Gateway pattern with rate limiting and caching'
        'graphql:GraphQL API with Apollo Server'
        'websocket:Real-time WebSocket application'
    )
    
    _arguments \
        '1:project name:' \
        '(-t --template)'{-t,--template}'[Use custom template]:template:(default microservice api-gateway graphql websocket)' \
        '(-d --dry-run)'{-d,--dry-run}'[Run in dry-run mode]' \
        '(-i --interactive)'{-i,--interactive}'[Run in interactive mode]' \
        '(-c --config)'{-c,--config}'[Use configuration file]:config file:_files -g "*.json"' \
        '(-v --verbose)'{-v,--verbose}'[Enable verbose logging]' \
        '--no-backup[Skip creating backups]' \
        '(-f --force)'{-f,--force}'[Force operation without prompts]' \
        '(-h --help)'{-h,--help}'[Show help message]'
}

_rest_spec_setup_standards() {
    _arguments \
        '1:target directory:_directories' \
        '(-r --rollback)'{-r,--rollback}'[Rollback previous operation]' \
        '(-d --dry-run)'{-d,--dry-run}'[Run in dry-run mode]' \
        '(-i --interactive)'{-i,--interactive}'[Run in interactive mode]' \
        '(-c --config)'{-c,--config}'[Use configuration file]:config file:_files -g "*.json"' \
        '(-v --verbose)'{-v,--verbose}'[Enable verbose logging]' \
        '--no-backup[Skip creating backups]' \
        '(-f --force)'{-f,--force}'[Force operation without prompts]' \
        '(-h --help)'{-h,--help}'[Show help message]'
}

# Register completions
_rest_spec_commands "$@"
`;
}

/**
 * Generate fish completion script
 * @returns {string} Fish completion script
 */
function generateFishCompletion() {
  return `# REST-SPEC CLI Auto-completion for Fish
# Save this as ~/.config/fish/completions/rest-spec.fish

# Global options
set -l global_opts \
    -s d -l dry-run -d "Run in dry-run mode (preview changes)" \
    -s i -l interactive -d "Run in interactive mode" \
    -s c -l config -d "Use configuration file" -r \
    -s v -l verbose -d "Enable verbose logging" \
    -l no-backup -d "Skip creating backups" \
    -s f -l force -d "Force operation without prompts" \
    -s h -l help -d "Show help message"

# Templates for create-project
set -l templates default microservice api-gateway graphql websocket

# create-project command
complete -c create-project -f
complete -c create-project -n '__fish_use_subcommand' -a 'create-project' -d 'Create a new REST API project'
complete -c create-project -s t -l template -d 'Use custom template' -xa "$templates"
complete -c create-project $global_opts

# setup-standards command  
complete -c setup-standards -f
complete -c setup-standards -n '__fish_use_subcommand' -a 'setup-standards' -d 'Apply REST-SPEC standards'
complete -c setup-standards -s r -l rollback -d 'Rollback previous operation'
complete -c setup-standards $global_opts

# Enhanced versions
complete -c rest-spec-create -f
complete -c rest-spec-create -s t -l template -d 'Use custom template' -xa "$templates"
complete -c rest-spec-create $global_opts

complete -c rest-spec-setup -f
complete -c rest-spec-setup -s r -l rollback -d 'Rollback previous operation'
complete -c rest-spec-setup $global_opts

# Config file completion
complete -c create-project -s c -l config -d 'Configuration file' -xa '(__fish_complete_suffix .json)'
complete -c setup-standards -s c -l config -d 'Configuration file' -xa '(__fish_complete_suffix .json)'
complete -c rest-spec-create -s c -l config -d 'Configuration file' -xa '(__fish_complete_suffix .json)'
complete -c rest-spec-setup -s c -l config -d 'Configuration file' -xa '(__fish_complete_suffix .json)'

# Directory completion for setup-standards
complete -c setup-standards -xa '(__fish_complete_directories)'
complete -c rest-spec-setup -xa '(__fish_complete_directories)'
`;
}

/**
 * Installation helper
 */
class CompletionInstaller {
  constructor() {
    this.homeDir = require("os").homedir();
    this.completionsDir = path.join(__dirname, "..", "completions");
  }

  /**
   * Create completions directory
   */
  async createCompletionsDir() {
    if (!fs.existsSync(this.completionsDir)) {
      fs.mkdirSync(this.completionsDir, { recursive: true });
    }
  }

  /**
   * Generate all completion scripts
   */
  async generateCompletions() {
    await this.createCompletionsDir();

    // Generate bash completion
    const bashScript = generateBashCompletion();
    fs.writeFileSync(
      path.join(this.completionsDir, "rest-spec-completion.bash"),
      bashScript,
    );

    // Generate zsh completion
    const zshScript = generateZshCompletion();
    fs.writeFileSync(path.join(this.completionsDir, "_rest-spec"), zshScript);

    // Generate fish completion
    const fishScript = generateFishCompletion();
    fs.writeFileSync(
      path.join(this.completionsDir, "rest-spec.fish"),
      fishScript,
    );

    console.log("✓ Auto-completion scripts generated successfully!");
    console.log(`Location: ${this.completionsDir}`);
  }

  /**
   * Install completions for the current user
   * @param {string} shell - Shell type (bash, zsh, fish)
   */
  async installCompletion(shell = "bash") {
    await this.generateCompletions();

    const instructions = this.getInstallationInstructions(shell);
    console.log(`\\nInstallation instructions for ${shell}:`);
    console.log(instructions);
  }

  /**
   * Get installation instructions for specific shell
   * @param {string} shell - Shell type
   * @returns {string} Installation instructions
   */
  getInstallationInstructions(shell) {
    const bashScript = path.join(
      this.completionsDir,
      "rest-spec-completion.bash",
    );
    const zshScript = path.join(this.completionsDir, "_rest-spec");
    const fishScript = path.join(this.completionsDir, "rest-spec.fish");

    switch (shell.toLowerCase()) {
      case "bash":
        return `
1. Add this line to your ~/.bashrc or ~/.bash_profile:
   source ${bashScript}

2. Reload your shell:
   source ~/.bashrc

3. Test completion:
   create-project [TAB]
        `;

      case "zsh":
        return `
1. Create zsh completions directory (if not exists):
   mkdir -p ~/.zsh/completions

2. Copy the completion file:
   cp ${zshScript} ~/.zsh/completions/

3. Add to your ~/.zshrc (if not already present):
   fpath=(~/.zsh/completions $fpath)
   autoload -U compinit && compinit

4. Reload your shell:
   source ~/.zshrc

5. Test completion:
   create-project [TAB]
        `;

      case "fish":
        return `
1. Create fish completions directory (if not exists):
   mkdir -p ~/.config/fish/completions

2. Copy the completion file:
   cp ${fishScript} ~/.config/fish/completions/

3. Reload fish completions:
   fish -c "complete --erase"

4. Test completion:
   create-project [TAB]
        `;

      default:
        return `
Unsupported shell: ${shell}
Supported shells: bash, zsh, fish
        `;
    }
  }

  /**
   * Show usage information
   */
  showUsage() {
    console.log(`
REST-SPEC CLI Auto-completion Setup

Usage:
  node auto-completion.js generate              Generate completion scripts
  node auto-completion.js install [shell]      Install for specific shell
  node auto-completion.js instructions [shell] Show installation instructions

Examples:
  node auto-completion.js generate
  node auto-completion.js install bash
  node auto-completion.js install zsh
  node auto-completion.js instructions fish

Supported shells: bash, zsh, fish
    `);
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const installer = new CompletionInstaller();

  if (args.length === 0) {
    installer.showUsage();
    return;
  }

  const command = args[0];
  const shell = args[1] || "bash";

  try {
    switch (command) {
      case "generate":
        await installer.generateCompletions();
        break;

      case "install":
        await installer.installCompletion(shell);
        break;

      case "instructions": {
        await installer.generateCompletions();
        const instructions = installer.getInstallationInstructions(shell);
        console.log(instructions);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        installer.showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  generateBashCompletion,
  generateZshCompletion,
  generateFishCompletion,
  CompletionInstaller,
  CLI_COMMANDS,
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

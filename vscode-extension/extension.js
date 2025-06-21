/**
 * REST-SPEC VS Code Extension
 *
 * Provides code snippets and utilities for REST-SPEC development
 * @author REST-SPEC Team
 */

const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/**
 * Template generators for different file types
 */
class TemplateGenerator {
  constructor(context) {
    this.context = context;
    this.config = vscode.workspace.getConfiguration("rest-spec");
  }

  /**
   * Get template variables from user input and configuration
   */
  async getTemplateVariables(type) {
    const defaultAuthor = this.config.get("defaultAuthor") || "";
    const useTypeScript = this.config.get("useTypeScript") || false;
    const includeJSDoc = this.config.get("includeJSDoc") || true;

    const variables = {
      author: defaultAuthor,
      useTypeScript,
      includeJSDoc,
      timestamp: new Date().toISOString(),
    };

    switch (type) {
      case "controller":
      case "model":
      case "route":
        variables.name = await vscode.window.showInputBox({
          prompt: `Enter ${type} name (e.g., User, Product)`,
          placeHolder: "ModelName",
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return "Name is required";
            }
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(value.trim())) {
              return "Name must start with uppercase letter and contain only letters and numbers";
            }
            return null;
          },
        });
        break;

      case "middleware":
        variables.name = await vscode.window.showInputBox({
          prompt: "Enter middleware name (e.g., authenticate, validateInput)",
          placeHolder: "middlewareName",
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return "Name is required";
            }
            if (!/^[a-z][a-zA-Z0-9]*$/.test(value.trim())) {
              return "Name must start with lowercase letter and contain only letters and numbers";
            }
            return null;
          },
        });
        break;

      case "test":
        variables.testType = await vscode.window.showQuickPick(
          ["unit", "integration", "e2e"],
          {
            prompt: "Select test type",
          },
        );

        variables.componentName = await vscode.window.showInputBox({
          prompt: "Enter component name to test",
          placeHolder: "ComponentName",
        });
        break;
    }

    if (!variables.name && !variables.componentName) {
      return null; // User cancelled
    }

    return variables;
  }

  /**
   * Generate controller file
   */
  async generateController(variables) {
    const { name, author, useTypeScript, includeJSDoc } = variables;
    const fileName = `${name.toLowerCase()}Controller.${useTypeScript ? "ts" : "js"}`;

    let content = "";

    if (includeJSDoc) {
      content += `/**\n * ${name} Controller\n * \n * Handles HTTP requests for ${name} resources\n * @author ${author}\n */\n\n`;
    }

    if (useTypeScript) {
      content += `import { Request, Response, NextFunction } from 'express';\n`;
      content += `import { ${name} } from '../models';\n`;
      content += `import { ValidationError, NotFoundError } from '../utils/errors';\n`;
      content += `import logger from '../utils/logger';\n\n`;
    } else {
      content += `const { ${name} } = require('../models');\n`;
      content += `const { ValidationError, NotFoundError } = require('../utils/errors');\n`;
      content += `const logger = require('../utils/logger');\n\n`;
    }

    // Add basic CRUD methods
    content += this.generateCRUDMethods(name, useTypeScript, includeJSDoc);

    return { fileName, content };
  }

  /**
   * Generate middleware file
   */
  async generateMiddleware(variables) {
    const { name, author, useTypeScript, includeJSDoc } = variables;
    const fileName = `${name}.${useTypeScript ? "ts" : "js"}`;

    let content = "";

    if (includeJSDoc) {
      content += `/**\n * ${name} Middleware\n * \n * @author ${author}\n */\n\n`;
    }

    if (useTypeScript) {
      content += `import { Request, Response, NextFunction } from 'express';\n`;
      content += `import logger from '../utils/logger';\n\n`;

      content += `export const ${name} = (req: Request, res: Response, next: NextFunction): void => {\n`;
    } else {
      content += `const logger = require('../utils/logger');\n\n`;

      content += `const ${name} = (req, res, next) => {\n`;
    }

    content += `  try {\n`;
    content += `    // Middleware logic here\n`;
    content += `    next();\n`;
    content += `  } catch (error) {\n`;
    content += `    logger.error('${name} middleware error:', error);\n`;
    content += `    next(error);\n`;
    content += `  }\n`;
    content += `};\n\n`;

    if (!useTypeScript) {
      content += `module.exports = ${name};\n`;
    }

    return { fileName, content };
  }

  /**
   * Generate model file
   */
  async generateModel(variables) {
    const { name, author, useTypeScript, includeJSDoc } = variables;
    const fileName = `${name.toLowerCase()}.${useTypeScript ? "ts" : "js"}`;

    let content = "";

    if (includeJSDoc) {
      content += `/**\n * ${name} Model\n * \n * Sequelize model definition for ${name}\n * @author ${author}\n */\n\n`;
    }

    if (useTypeScript) {
      content += `import { DataTypes, Model, Sequelize } from 'sequelize';\n\n`;
      content += `export interface ${name}Attributes {\n`;
      content += `  id: number;\n`;
      content += `  name: string;\n`;
      content += `  description?: string;\n`;
      content += `  isActive: boolean;\n`;
      content += `  createdAt: Date;\n`;
      content += `  updatedAt: Date;\n`;
      content += `}\n\n`;
      content += `export class ${name} extends Model<${name}Attributes> implements ${name}Attributes {\n`;
      content += `  public id!: number;\n`;
      content += `  public name!: string;\n`;
      content += `  public description?: string;\n`;
      content += `  public isActive!: boolean;\n`;
      content += `  public readonly createdAt!: Date;\n`;
      content += `  public readonly updatedAt!: Date;\n`;
      content += `}\n\n`;
      content += `export const init${name} = (sequelize: Sequelize) => {\n`;
    } else {
      content += `const { DataTypes } = require('sequelize');\n\n`;
      content += `module.exports = (sequelize) => {\n`;
    }

    content += `  const ${name} = sequelize.define('${name}', {\n`;
    content += `    id: {\n`;
    content += `      type: DataTypes.INTEGER,\n`;
    content += `      primaryKey: true,\n`;
    content += `      autoIncrement: true\n`;
    content += `    },\n`;
    content += `    name: {\n`;
    content += `      type: DataTypes.STRING(255),\n`;
    content += `      allowNull: false,\n`;
    content += `      validate: {\n`;
    content += `        notEmpty: true,\n`;
    content += `        len: [1, 255]\n`;
    content += `      }\n`;
    content += `    },\n`;
    content += `    description: {\n`;
    content += `      type: DataTypes.TEXT,\n`;
    content += `      allowNull: true\n`;
    content += `    },\n`;
    content += `    isActive: {\n`;
    content += `      type: DataTypes.BOOLEAN,\n`;
    content += `      defaultValue: true\n`;
    content += `    }\n`;
    content += `  }, {\n`;
    content += `    tableName: '${name.toLowerCase()}s',\n`;
    content += `    timestamps: true,\n`;
    content += `    paranoid: true,\n`;
    content += `    underscored: true\n`;
    content += `  });\n\n`;

    content += `  ${name}.associate = (models) => {\n`;
    content += `    // Define associations here\n`;
    content += `  };\n\n`;

    content += `  return ${name};\n`;
    content += `};\n`;

    return { fileName, content };
  }

  /**
   * Generate route file
   */
  async generateRoute(variables) {
    const { name, author, useTypeScript, includeJSDoc } = variables;
    const fileName = `${name.toLowerCase()}Routes.${useTypeScript ? "ts" : "js"}`;

    let content = "";

    if (includeJSDoc) {
      content += `/**\n * ${name} Routes\n * \n * Defines HTTP routes for ${name} resources\n * @author ${author}\n */\n\n`;
    }

    if (useTypeScript) {
      content += `import express from 'express';\n`;
      content += `import { validateRequest, authenticate, authorize } from '../middlewares';\n`;
      content += `import * as ${name.toLowerCase()}Controller from '../controllers/${name.toLowerCase()}Controller';\n\n`;
    } else {
      content += `const express = require('express');\n`;
      content += `const { validateRequest, authenticate, authorize } = require('../middlewares');\n`;
      content += `const ${name.toLowerCase()}Controller = require('../controllers/${name.toLowerCase()}Controller');\n\n`;
    }

    content += `const router = express.Router();\n\n`;
    content += `router.use(authenticate);\n\n`;

    // Add CRUD routes
    content += `router.get('/', authorize(['admin', 'user']), ${name.toLowerCase()}Controller.getAll${name}s);\n`;
    content += `router.get('/:id', authorize(['admin', 'user']), ${name.toLowerCase()}Controller.get${name}ById);\n`;
    content += `router.post('/', authorize(['admin']), ${name.toLowerCase()}Controller.create${name});\n`;
    content += `router.put('/:id', authorize(['admin']), ${name.toLowerCase()}Controller.update${name});\n`;
    content += `router.delete('/:id', authorize(['admin']), ${name.toLowerCase()}Controller.delete${name});\n\n`;

    if (useTypeScript) {
      content += `export default router;\n`;
    } else {
      content += `module.exports = router;\n`;
    }

    return { fileName, content };
  }

  /**
   * Generate test file
   */
  async generateTest(variables) {
    const { componentName, testType, author, useTypeScript } = variables;
    const fileName = `${componentName.toLowerCase()}.test.${useTypeScript ? "ts" : "js"}`;

    let content = "";

    content += `/**\n * ${componentName} Tests\n * \n * ${testType} tests for ${componentName}\n * @author ${author}\n */\n\n`;

    if (testType === "unit") {
      content += `const ${componentName} = require('../src/${componentName.toLowerCase()}');\n\n`;
    } else {
      content += `const request = require('supertest');\n`;
      content += `const app = require('../src/app');\n\n`;
    }

    content += `describe('${componentName}', () => {\n`;
    content += `  beforeAll(async () => {\n`;
    content += `    // Setup before all tests\n`;
    content += `  });\n\n`;
    content += `  afterAll(async () => {\n`;
    content += `    // Cleanup after all tests\n`;
    content += `  });\n\n`;
    content += `  beforeEach(async () => {\n`;
    content += `    // Setup before each test\n`;
    content += `  });\n\n`;
    content += `  afterEach(async () => {\n`;
    content += `    // Cleanup after each test\n`;
    content += `  });\n\n`;
    content += `  describe('Sample Test', () => {\n`;
    content += `    it('should pass', () => {\n`;
    content += `      expect(true).toBe(true);\n`;
    content += `    });\n`;
    content += `  });\n`;
    content += `});\n`;

    return { fileName, content };
  }

  /**
   * Generate CRUD methods for controllers
   */
  generateCRUDMethods(modelName, useTypeScript, includeJSDoc) {
    let content = "";
    const modelVar = modelName.toLowerCase();

    // getAll method
    if (includeJSDoc) {
      content += `/**\n * Get all ${modelVar} records\n */\n`;
    }

    if (useTypeScript) {
      content += `export const getAll${modelName}s = async (req: Request, res: Response, next: NextFunction): Promise<void> => {\n`;
    } else {
      content += `const getAll${modelName}s = async (req, res, next) => {\n`;
    }

    content += `  try {\n`;
    content += `    const { page = 1, limit = 10 } = req.query;\n`;
    content += `    const offset = (page - 1) * limit;\n\n`;
    content += `    const { rows: ${modelVar}s, count } = await ${modelName}.findAndCountAll({\n`;
    content += `      offset: parseInt(offset),\n`;
    content += `      limit: parseInt(limit)\n`;
    content += `    });\n\n`;
    content += `    res.json({\n`;
    content += `      success: true,\n`;
    content += `      data: ${modelVar}s,\n`;
    content += `      pagination: {\n`;
    content += `        page: parseInt(page),\n`;
    content += `        limit: parseInt(limit),\n`;
    content += `        total: count,\n`;
    content += `        totalPages: Math.ceil(count / limit)\n`;
    content += `      }\n`;
    content += `    });\n`;
    content += `  } catch (error) {\n`;
    content += `    logger.error('Error fetching ${modelVar}s:', error);\n`;
    content += `    next(error);\n`;
    content += `  }\n`;
    content += `};\n\n`;

    // Export for CommonJS
    if (!useTypeScript) {
      content += `module.exports = {\n`;
      content += `  getAll${modelName}s\n`;
      content += `  // Add other methods here\n`;
      content += `};\n`;
    }

    return content;
  }

  /**
   * Create file in workspace
   */
  async createFile(fileName, content, subDir = "") {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }

    const dirPath = path.join(workspaceFolder.uri.fsPath, "src", subDir);
    const filePath = path.join(dirPath, fileName);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      const overwrite = await vscode.window.showWarningMessage(
        `File ${fileName} already exists. Overwrite?`,
        "Yes",
        "No",
      );
      if (overwrite !== "Yes") {
        return;
      }
    }

    // Write file
    fs.writeFileSync(filePath, content);

    // Open file in editor
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage(`${fileName} created successfully!`);
  }
}

/**
 * Activate extension
 */
function activate(context) {
  const templateGenerator = new TemplateGenerator(context);

  // Register commands
  const commands = [
    {
      name: "rest-spec.createController",
      handler: async () => {
        const variables =
          await templateGenerator.getTemplateVariables("controller");
        if (variables) {
          const { fileName, content } =
            await templateGenerator.generateController(variables);
          await templateGenerator.createFile(fileName, content, "controllers");
        }
      },
    },
    {
      name: "rest-spec.createMiddleware",
      handler: async () => {
        const variables =
          await templateGenerator.getTemplateVariables("middleware");
        if (variables) {
          const { fileName, content } =
            await templateGenerator.generateMiddleware(variables);
          await templateGenerator.createFile(fileName, content, "middlewares");
        }
      },
    },
    {
      name: "rest-spec.createModel",
      handler: async () => {
        const variables = await templateGenerator.getTemplateVariables("model");
        if (variables) {
          const { fileName, content } =
            await templateGenerator.generateModel(variables);
          await templateGenerator.createFile(fileName, content, "models");
        }
      },
    },
    {
      name: "rest-spec.createRoute",
      handler: async () => {
        const variables = await templateGenerator.getTemplateVariables("route");
        if (variables) {
          const { fileName, content } =
            await templateGenerator.generateRoute(variables);
          await templateGenerator.createFile(fileName, content, "routes");
        }
      },
    },
    {
      name: "rest-spec.createTest",
      handler: async () => {
        const variables = await templateGenerator.getTemplateVariables("test");
        if (variables) {
          const { fileName, content } =
            await templateGenerator.generateTest(variables);
          await templateGenerator.createFile(fileName, content, "../tests");
        }
      },
    },
  ];

  // Register all commands
  commands.forEach((command) => {
    const disposable = vscode.commands.registerCommand(
      command.name,
      command.handler,
    );
    context.subscriptions.push(disposable);
  });

  console.log("REST-SPEC extension is now active!");
}

/**
 * Deactivate extension
 */
function deactivate() {
  // Cleanup if needed
}

module.exports = {
  activate,
  deactivate,
};

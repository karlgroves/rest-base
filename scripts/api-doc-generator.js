#!/usr/bin/env node

/**
 * API Documentation Generator
 *
 * Automatically generates comprehensive API documentation from Express routes
 * Supports OpenAPI/Swagger specification, Markdown, and HTML output formats
 *
 * @author REST-SPEC
 */

const fs = require("fs").promises;
const path = require("path");
const { program } = require("commander");
// Simple color functions to avoid ESM issues with chalk v5
const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};
// Simple spinner implementation to avoid ESM issues
const createSpinner = (text) => {
  let interval;
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  const spinner = {
    start() {
      process.stdout.write(`\r${frames[i]} ${text}`);
      interval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${spinner.text || text}`);
        i = (i + 1) % frames.length;
      }, 80);
      return spinner;
    },
    succeed(msg) {
      clearInterval(interval);
      process.stdout.write(`\r✓ ${msg}\n`);
    },
    fail(msg) {
      clearInterval(interval);
      process.stdout.write(`\r✗ ${msg}\n`);
    },
    text: text,
  };

  return spinner;
};
const { glob } = require("glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
// Simple logger for this script
const logger = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(`⚠️  ${message}`),
  error: (message, error) => console.error(`❌ ${message}`, error || ""),
};

// OpenAPI template
const openAPITemplate = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "Auto-generated API documentation",
  },
  servers: [],
  paths: {},
  components: {
    schemas: {},
    securitySchemes: {},
  },
};

/**
 * Parse Express route files to extract API information
 */
async function parseRouteFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  const ast = parser.parse(content, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });

  const routes = [];
  const routeComments = new Map();

  // First pass: collect JSDoc comments
  traverse(ast, {
    enter(path) {
      if (path.node.leadingComments) {
        path.node.leadingComments.forEach((comment) => {
          if (
            comment.type === "CommentBlock" &&
            comment.value.includes("@route")
          ) {
            const parsedDoc = parseJSDoc(comment.value);
            // Store by line number for easier matching
            routeComments.set(comment.end, parsedDoc);
          }
        });
      }
    },
  });

  // Second pass: extract route definitions
  traverse(ast, {
    CallExpression(path) {
      const { callee, arguments: args } = path.node;

      // Check for router.METHOD() or app.METHOD() calls
      if (
        callee.type === "MemberExpression" &&
        ["get", "post", "put", "patch", "delete", "options", "head"].includes(
          callee.property.name,
        )
      ) {
        const method = callee.property.name.toUpperCase();
        const routePath = args[0]?.value || args[0]?.quasis?.[0]?.value?.raw;

        if (routePath) {
          const routeInfo = {
            method,
            path: routePath,
            file: filePath,
            handlers: [],
          };

          // Check for JSDoc comment by finding the closest one before this route
          let closestComment = null;
          let closestDistance = Infinity;

          for (const [commentEnd, doc] of routeComments.entries()) {
            const distance = path.node.start - commentEnd;
            if (distance > 0 && distance < closestDistance) {
              closestDistance = distance;
              closestComment = doc;
            }
          }

          if (closestComment) {
            Object.assign(routeInfo, closestComment);
            // If the JSDoc has a different path, prefer it
            if (closestComment.fullPath) {
              routeInfo.path = closestComment.fullPath;
            }
          }

          // Extract middleware and handler names
          args.slice(1).forEach((arg) => {
            if (arg.type === "Identifier") {
              routeInfo.handlers.push(arg.name);
            }
          });

          routes.push(routeInfo);
        }
      }
    },
  });

  return routes;
}

/**
 * Parse JSDoc comments for route information
 */
function parseJSDoc(comment) {
  const info = {
    summary: "",
    description: "",
    parameters: [],
    responses: {},
    tags: [],
    security: [],
    fullPath: null,
  };

  const lines = comment
    .split("\n")
    .map((line) => line.trim().replace(/^\* ?/, ""));

  let currentSection = "description";
  lines.forEach((line) => {
    if (line.startsWith("@route")) {
      const routeMatch = line.match(/@route\s+(\w+)\s+(\/[^\s]+)/);
      if (routeMatch) {
        info.summary = line.replace("@route", "").trim();
        info.fullPath = routeMatch[2];
      }
    } else if (line.startsWith("@summary")) {
      info.summary = line.replace("@summary", "").trim();
    } else if (line.startsWith("@description")) {
      currentSection = "description";
      info.description = line.replace("@description", "").trim();
    } else if (line.startsWith("@param")) {
      const match = line.match(/@param\s+{([^}]+)}\s+(\[?)([^\]]+)\]?\s*(.*)/);
      if (match) {
        info.parameters.push({
          name: match[3],
          type: match[1],
          required: !match[2],
          description: match[4],
        });
      }
    } else if (line.startsWith("@response")) {
      const match = line.match(/@response\s+(\d{3})\s+(.*)/);
      if (match) {
        info.responses[match[1]] = { description: match[2] };
      }
    } else if (line.startsWith("@tag")) {
      info.tags.push(line.replace("@tag", "").trim());
    } else if (line.startsWith("@security")) {
      info.security.push(line.replace("@security", "").trim());
    } else if (
      currentSection === "description" &&
      line &&
      !line.startsWith("@")
    ) {
      info.description += (info.description ? " " : "") + line;
    }
  });

  return info;
}

/**
 * Scan project for route files
 */
async function findRouteFiles(projectPath, pattern = "**/routes/**/*.js") {
  const files = await glob(pattern, {
    cwd: projectPath,
    ignore: ["**/node_modules/**", "**/test/**", "**/tests/**"],
  });
  return files.map((f) => path.join(projectPath, f));
}

/**
 * Generate OpenAPI specification
 */
function generateOpenAPI(routes, config) {
  const spec = JSON.parse(JSON.stringify(openAPITemplate));

  // Update info
  spec.info.title = config.title || spec.info.title;
  spec.info.version = config.version || spec.info.version;
  spec.info.description = config.description || spec.info.description;

  // Add servers
  if (config.servers) {
    spec.servers = config.servers;
  }

  // Group routes by path
  const pathGroups = {};
  routes.forEach((route) => {
    if (!pathGroups[route.path]) {
      pathGroups[route.path] = {};
    }

    const operation = {
      summary: route.summary || `${route.method} ${route.path}`,
      description: route.description,
      operationId: `${route.method.toLowerCase()}${route.path.replace(/[/:]/g, "_")}`,
      tags: route.tags || [],
      parameters: [],
      responses: route.responses || {
        200: { description: "Successful response" },
        400: { description: "Bad request" },
        500: { description: "Internal server error" },
      },
    };

    // Add parameters
    if (route.parameters) {
      route.parameters.forEach((param) => {
        const paramDef = {
          name: param.name,
          in: route.path.includes(`:${param.name}`) ? "path" : "query",
          required: param.required,
          description: param.description,
          schema: { type: param.type.toLowerCase() },
        };
        operation.parameters.push(paramDef);
      });
    }

    // Add security
    if (route.security && route.security.length > 0) {
      operation.security = route.security.map((s) => ({ [s]: [] }));
    }

    pathGroups[route.path][route.method.toLowerCase()] = operation;
  });

  spec.paths = pathGroups;
  return spec;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdown(routes, config) {
  let markdown = `# ${config.title || "API Documentation"}\n\n`;
  markdown += `${config.description || "Auto-generated API documentation"}\n\n`;
  markdown += `**Version:** ${config.version || "1.0.0"}\n\n`;

  if (config.servers && config.servers.length > 0) {
    markdown += "## Servers\n\n";
    config.servers.forEach((server) => {
      markdown += `- ${server.url}${server.description ? ` - ${server.description}` : ""}\n`;
    });
    markdown += "\n";
  }

  markdown += "## Endpoints\n\n";

  // Group by tags
  const tagGroups = { untagged: [] };
  routes.forEach((route) => {
    const tags =
      route.tags && route.tags.length > 0 ? route.tags : ["untagged"];
    tags.forEach((tag) => {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(route);
    });
  });

  Object.entries(tagGroups).forEach(([tag, tagRoutes]) => {
    if (tagRoutes.length === 0) return;

    if (tag !== "untagged") {
      markdown += `### ${tag}\n\n`;
    }

    tagRoutes.forEach((route) => {
      markdown += `#### ${route.method} ${route.path}\n\n`;

      if (route.summary) {
        markdown += `${route.summary}\n\n`;
      }

      if (route.description) {
        markdown += `${route.description}\n\n`;
      }

      if (route.parameters && route.parameters.length > 0) {
        markdown += "**Parameters:**\n\n";
        markdown += "| Name | Type | Required | Description |\n";
        markdown += "|------|------|----------|-------------|\n";
        route.parameters.forEach((param) => {
          markdown += `| ${param.name} | ${param.type} | ${param.required ? "Yes" : "No"} | ${param.description || "-"} |\n`;
        });
        markdown += "\n";
      }

      if (route.responses) {
        markdown += "**Responses:**\n\n";
        markdown += "| Status | Description |\n";
        markdown += "|--------|-------------|\n";
        Object.entries(route.responses).forEach(([status, response]) => {
          markdown += `| ${status} | ${response.description} |\n`;
        });
        markdown += "\n";
      }

      if (route.security && route.security.length > 0) {
        markdown += `**Security:** ${route.security.join(", ")}\n\n`;
      }

      markdown += "---\n\n";
    });
  });

  return markdown;
}

/**
 * Generate HTML documentation
 */
function generateHTML(routes, config) {
  const markdown = generateMarkdown(routes, config);
  const marked = require("marked");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title || "API Documentation"}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: #f5f5f5;
        }
        h1, h2, h3, h4 {
            color: #2c3e50;
        }
        h1 {
            border-bottom: 3px solid #3498db;
            padding-bottom: 0.5rem;
        }
        h2 {
            margin-top: 2rem;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 0.3rem;
        }
        h3 {
            color: #34495e;
            margin-top: 1.5rem;
        }
        h4 {
            background: #ecf0f1;
            padding: 0.5rem 1rem;
            border-left: 4px solid #3498db;
            margin: 1rem 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #34495e;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background: #f8f9fa;
        }
        code {
            background: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }
        .method {
            font-weight: bold;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            color: white;
            font-size: 0.9rem;
        }
        .method-GET { background: #27ae60; }
        .method-POST { background: #3498db; }
        .method-PUT { background: #f39c12; }
        .method-PATCH { background: #e67e22; }
        .method-DELETE { background: #e74c3c; }
        hr {
            border: none;
            border-top: 1px solid #ecf0f1;
            margin: 2rem 0;
        }
    </style>
</head>
<body>
    ${marked
      .parse(markdown)
      .replace(
        /<h4>(GET|POST|PUT|PATCH|DELETE)\s+(.+?)<\/h4>/g,
        '<h4><span class="method method-$1">$1</span> $2</h4>',
      )}
</body>
</html>
  `;

  return html;
}

/**
 * Load configuration file
 */
async function loadConfig(configPath) {
  if (!configPath || !(await fs.stat(configPath).catch(() => false))) {
    return {};
  }

  const content = await fs.readFile(configPath, "utf8");
  return JSON.parse(content);
}

/**
 * Main function
 */
async function main() {
  program
    .name("api-doc-generator")
    .description("Generate API documentation from Express routes")
    .version("1.0.0")
    .option("-p, --project <path>", "Project path", process.cwd())
    .option("-o, --output <path>", "Output path", "./api-docs")
    .option(
      "-f, --format <format>",
      "Output format (openapi, markdown, html, all)",
      "all",
    )
    .option("-c, --config <path>", "Configuration file path")
    .option("--pattern <pattern>", "Route file pattern", "**/routes/**/*.js")
    .option("--title <title>", "API title")
    .option("--version <version>", "API version")
    .option("--server <url>", "Server URL")
    .parse(process.argv);

  const options = program.opts();
  const spinner = createSpinner("Generating API documentation...").start();

  try {
    // Load configuration
    const fileConfig = await loadConfig(options.config);
    const config = {
      ...fileConfig,
      title: options.title || fileConfig.title || "API Documentation",
      version: options.version || fileConfig.version || "1.0.0",
      servers: options.server
        ? [{ url: options.server }]
        : fileConfig.servers || [],
    };

    // Find route files
    spinner.text = "Finding route files...";
    const routeFiles = await findRouteFiles(options.project, options.pattern);

    if (routeFiles.length === 0) {
      spinner.fail("No route files found");
      process.exit(1);
    }

    spinner.text = `Found ${routeFiles.length} route files`;

    // Parse routes
    spinner.text = "Parsing routes...";
    const allRoutes = [];
    for (const file of routeFiles) {
      try {
        const routes = await parseRouteFile(file);
        allRoutes.push(...routes);
      } catch (error) {
        logger.warn(`Failed to parse ${file}: ${error.message}`);
      }
    }

    if (allRoutes.length === 0) {
      spinner.fail("No routes found");
      process.exit(1);
    }

    spinner.text = `Found ${allRoutes.length} routes`;

    // Create output directory
    await fs.mkdir(options.output, { recursive: true });

    // Generate documentation
    const formats =
      options.format === "all"
        ? ["openapi", "markdown", "html"]
        : [options.format];

    for (const format of formats) {
      spinner.text = `Generating ${format} documentation...`;

      switch (format) {
        case "openapi": {
          const openapi = generateOpenAPI(allRoutes, config);
          await fs.writeFile(
            path.join(options.output, "openapi.json"),
            JSON.stringify(openapi, null, 2),
          );
          await fs.writeFile(
            path.join(options.output, "openapi.yaml"),
            require("js-yaml").dump(openapi),
          );
          break;
        }

        case "markdown": {
          const markdown = generateMarkdown(allRoutes, config);
          await fs.writeFile(path.join(options.output, "API.md"), markdown);
          break;
        }

        case "html": {
          const html = generateHTML(allRoutes, config);
          await fs.writeFile(path.join(options.output, "index.html"), html);
          break;
        }
      }
    }

    spinner.succeed(
      color.green(
        `API documentation generated successfully in ${options.output}`,
      ),
    );

    // Summary
    console.log("\n" + color.bold("Summary:"));
    console.log(color.gray("─".repeat(40)));
    console.log(`Routes found: ${color.cyan(allRoutes.length)}`);
    console.log(`Files processed: ${color.cyan(routeFiles.length)}`);
    console.log(`Output formats: ${color.cyan(formats.join(", "))}`);
    console.log(`Output directory: ${color.cyan(options.output)}`);
  } catch (error) {
    spinner.fail(color.red("Failed to generate documentation"));
    logger.error("Documentation generation failed:", error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  parseRouteFile,
  findRouteFiles,
  generateOpenAPI,
  generateMarkdown,
  generateHTML,
};

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(color.red("Error:"), error.message);
    process.exit(1);
  });
}

#!/usr/bin/env node

/**
 * Add Table of Contents to Markdown Files
 * 
 * Automatically generates and adds table of contents to long markdown files
 * @author Karl Groves
 */

const fs = require('fs').promises;
const path = require('path');

class TOCGenerator {
  /**
   * Generate table of contents from markdown content
   */
  generateTOC(content) {
    const lines = content.split('\n');
    const toc = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      // Skip code blocks
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      // Match headings (## and deeper, skip # which is the main title)
      const match = line.match(/^(#{2,})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2];
        const anchor = this.createAnchor(title);
        const indent = '  '.repeat(level - 2); // Start indentation at ##
        
        toc.push(`${indent}- [${title}](#${anchor})`);
      }
    }
    
    return toc;
  }
  
  /**
   * Create GitHub-style anchor link from heading text
   */
  createAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
  
  /**
   * Check if file already has table of contents
   */
  hasTableOfContents(content) {
    return /^## Table of Contents$/m.test(content) || /^# Table of Contents$/m.test(content);
  }
  
  /**
   * Add table of contents to markdown content
   */
  addTableOfContents(content) {
    if (this.hasTableOfContents(content)) {
      console.log('  ✓ Already has table of contents');
      return content;
    }
    
    const toc = this.generateTOC(content);
    if (toc.length === 0) {
      console.log('  ✓ No headings found');
      return content;
    }
    
    const lines = content.split('\n');
    let insertIndex = -1;
    
    // Find where to insert TOC (after navigation line or after first paragraph)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip the main title and navigation
      if (line.startsWith('# ') || line.startsWith('> **Navigation:')) {
        continue;
      }
      
      // Insert after navigation block or before first ## heading
      if (line.startsWith('##') || (i > 0 && lines[i-1].trim() === '' && line.trim() !== '')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex === -1) {
      // If no good spot found, insert after title
      insertIndex = 2;
    }
    
    // Insert TOC
    const tocLines = [
      '',
      '## Table of Contents',
      '',
      ...toc,
      ''
    ];
    
    lines.splice(insertIndex, 0, ...tocLines);
    
    console.log(`  ✓ Added table of contents with ${toc.length} sections`);
    return lines.join('\n');
  }
  
  /**
   * Process a single markdown file
   */
  async processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const updatedContent = this.addTableOfContents(content);
      
      if (content !== updatedContent) {
        await fs.writeFile(filePath, updatedContent, 'utf8');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Process multiple files
   */
  async processFiles(files, minLines = 100) {
    const processedFiles = [];
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const lineCount = content.split('\n').length;
        
        console.log(`\nProcessing ${path.basename(filePath)} (${lineCount} lines)...`);
        
        if (lineCount < minLines) {
          console.log(`  ⏭ Skipping - file too short (< ${minLines} lines)`);
          continue;
        }
        
        const wasModified = await this.processFile(filePath);
        if (wasModified) {
          processedFiles.push(filePath);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${filePath}: ${error.message}`);
      }
    }
    
    return processedFiles;
  }
}

async function main() {
  const tocGenerator = new TOCGenerator();
  
  // Files that need table of contents (from our earlier analysis)
  const filesToProcess = [
    '/Users/karlgroves/Projects/REST-SPEC/global-rules.md',
    '/Users/karlgroves/Projects/REST-SPEC/operations-and-responses.md',
    '/Users/karlgroves/Projects/REST-SPEC/README.md',
    '/Users/karlgroves/Projects/REST-SPEC/request.md',
    '/Users/karlgroves/Projects/REST-SPEC/technologies.md',
    '/Users/karlgroves/Projects/REST-SPEC/visual-design-requirements.md'
  ];
  
  console.log('🔗 Adding Table of Contents to Documentation Files');
  console.log('===================================================');
  
  const processedFiles = await tocGenerator.processFiles(filesToProcess);
  
  console.log(`\n✅ Processing complete!`);
  console.log(`📝 Modified ${processedFiles.length} files`);
  
  if (processedFiles.length > 0) {
    console.log('\nModified files:');
    processedFiles.forEach(file => {
      console.log(`  - ${path.basename(file)}`);
    });
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = TOCGenerator;
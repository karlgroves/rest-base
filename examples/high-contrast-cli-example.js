#!/usr/bin/env node

/**
 * Example of using high contrast support in CLI scripts
 * 
 * @author Karl Groves
 */

const logger = require('../shared/logger');
const { 
  formatSection, 
  formatStatus, 
  createBox,
  formatProgress,
  createSpinner,
  formatListItem
} = require('../shared/cli-utils');

async function exampleCLIScript() {
  // Display a section header
  console.log(formatSection('Example CLI Script'));
  
  // Use the logger for different message types
  logger.info('Starting example process...');
  
  // Show a spinner for async operations
  const spinner = createSpinner('Loading configuration...');
  spinner.start();
  
  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 1500));
  spinner.succeed('Configuration loaded');
  
  // Display status messages
  console.log('\n' + formatStatus('success', 'Database connection established'));
  console.log(formatStatus('warning', 'Cache is not configured'));
  console.log(formatStatus('info', 'Using default settings'));
  
  // Show progress for multi-step operations
  console.log('\nProcessing files:');
  const files = ['config.js', 'index.js', 'routes.js', 'models.js'];
  
  for (let i = 0; i < files.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(formatProgress('Progress', i + 1, files.length));
  }
  
  // Display results in a list
  console.log('\nProcessed files:');
  files.forEach(file => {
    console.log(formatListItem(`${file} - OK`));
  });
  
  // Show important information in a box
  const summary = `Total files: ${files.length}\nStatus: Complete\nErrors: 0`;
  console.log('\n' + createBox(summary));
  
  // Use label-value pairs for structured data
  console.log('\nSummary:');
  logger.labelValue('Total files', files.length);
  logger.labelValue('Successful', files.length);
  logger.labelValue('Failed', 0);
  logger.labelValue('Time elapsed', '2.5s');
  
  // Final success message
  logger.success('\nExample process completed successfully!');
}

// Error handling with styled output
async function main() {
  try {
    await exampleCLIScript();
  } catch (error) {
    logger.error('Script failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
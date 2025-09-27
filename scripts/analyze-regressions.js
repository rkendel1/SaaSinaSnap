#!/usr/bin/env node

/**
 * Regression Analysis Script
 * Compares current test results with previous results to identify regressions
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const previousDir = args.find(arg => arg.startsWith('--previous='))?.split('=')[1];
const currentDir = args.find(arg => arg.startsWith('--current='))?.split('=')[1];
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'regression-analysis.md';

console.log('🔍 Starting regression analysis...\n');

/**
 * Load test results from directory
 */
function loadTestResults(directory) {
  console.log(`📊 Loading test results from: ${directory}`);
  
  if (!fs.existsSync(directory)) {
    console.log(`⚠️ Directory not found: ${directory}`);
    return null;
  }
  
  const results = {
    summary: {},
    details: [],
    timestamp: null,
    build: null
  };
  
  try {
    // Look for results.json files
    const files = fs.readdirSync(directory, { recursive: true });
    const resultFiles = files.filter(file => file.includes('results.json'));
    
    console.log(`Found ${resultFiles.length} result files`);
    
    resultFiles.forEach(file => {
      const filePath = path.join(directory, file);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          results.details.push({
            file: file,
            data: data
          });
          
          // Extract summary information
          if (data.suites) {
            data.suites.forEach(suite => {
              const suiteName = suite.title || 'unknown';
              if (!results.summary[suiteName]) {
                results.summary[suiteName] = {
                  total: 0,
                  passed: 0,
                  failed: 0,
                  skipped: 0,
                  duration: 0
                };
              }
              
              suite.specs?.forEach(spec => {
                results.summary[suiteName].total++;
                results.summary[suiteName].duration += spec.duration || 0;
                
                const outcome = spec.outcome || 'unknown';
                if (outcome === 'expected') {
                  results.summary[suiteName].passed++;
                } else if (outcome === 'unexpected') {
                  results.summary[suiteName].failed++;
                } else if (outcome === 'skipped') {
                  results.summary[suiteName].skipped++;
                }
              });
            });
          }
        } catch (error) {
          console.error(`Error parsing ${file}:`, error.message);
        }
      }
    });
    
    // Extract timestamp if available
    if (results.details.length > 0) {
      const firstResult = results.details[0].data;
      results.timestamp = firstResult.stats?.startTime || new Date().toISOString();
    }
    
  } catch (error) {
    console.error(`Error loading test results: ${error.message}`);
    return null;
  }
  
  return results;
}

/**
 * Compare test results and identify regressions
 */
function analyzeRegressions(previousResults, currentResults) {
  console.log('🔍 Analyzing regressions...');
  
  const analysis = {
    newFailures: [],
    fixedTests: [],
    performanceRegressions: [],
    newTests: [],
    removedTests: [],
    summary: {
      totalRegressions: 0,
      totalImprovements: 0,
      criticalIssues: 0
    }
  };
  
  if (!previousResults) {
    console.log('⚠️ No previous results available - this is the baseline');
    return {
      ...analysis,
      baseline: true,
      message: 'This is the first test run - establishing baseline'
    };
  }
  
  // Compare test suites
  const previousSuites = Object.keys(previousResults.summary);
  const currentSuites = Object.keys(currentResults.summary);
  
  // Find new and removed test suites
  const newSuites = currentSuites.filter(suite => !previousSuites.includes(suite));
  const removedSuites = previousSuites.filter(suite => !currentSuites.includes(suite));
  
  analysis.newTests = newSuites;
  analysis.removedTests = removedSuites;
  
  // Compare common test suites
  const commonSuites = currentSuites.filter(suite => previousSuites.includes(suite));
  
  commonSuites.forEach(suiteName => {
    const previous = previousResults.summary[suiteName];
    const current = currentResults.summary[suiteName];
    
    // Check for new failures
    if (current.failed > previous.failed) {
      analysis.newFailures.push({
        suite: suiteName,
        previousFailures: previous.failed,
        currentFailures: current.failed,
        newFailureCount: current.failed - previous.failed
      });
      analysis.summary.totalRegressions++;
      
      // Mark as critical if failure rate is high
      const failureRate = current.failed / current.total;
      if (failureRate > 0.2) { // More than 20% failures
        analysis.summary.criticalIssues++;
      }
    }
    
    // Check for fixed tests
    if (current.failed < previous.failed) {
      analysis.fixedTests.push({
        suite: suiteName,
        previousFailures: previous.failed,
        currentFailures: current.failed,
        fixedCount: previous.failed - current.failed
      });
      analysis.summary.totalImprovements++;
    }
    
    // Check for performance regressions (>20% slower)
    const previousAvgDuration = previous.duration / Math.max(previous.total, 1);
    const currentAvgDuration = current.duration / Math.max(current.total, 1);
    
    if (currentAvgDuration > previousAvgDuration * 1.2) {
      analysis.performanceRegressions.push({
        suite: suiteName,
        previousDuration: Math.round(previousAvgDuration),
        currentDuration: Math.round(currentAvgDuration),
        slowdownPercentage: Math.round(((currentAvgDuration / previousAvgDuration) - 1) * 100)
      });
    }
  });
  
  return analysis;
}

/**
 * Generate detailed regression report
 */
function generateRegressionReport(analysis, previousResults, currentResults) {
  console.log('📝 Generating regression report...');
  
  let report = `# 🔍 Regression Analysis Report\n\n`;
  
  // Header information
  report += `**Analysis Date:** ${new Date().toISOString()}\n`;
  report += `**Previous Build:** ${previousResults?.timestamp || 'Unknown'}\n`;
  report += `**Current Build:** ${currentResults?.timestamp || 'Unknown'}\n\n`;
  
  // Executive Summary
  report += `## 📊 Executive Summary\n\n`;
  
  if (analysis.baseline) {
    report += `🆕 **Baseline Established** - This is the first test run\n\n`;
    report += `### Current Test Coverage\n`;
    Object.entries(currentResults.summary).forEach(([suite, stats]) => {
      const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
      report += `- **${suite}:** ${stats.total} tests, ${stats.passed} passed (${passRate}%)\n`;
    });
  } else {
    // Summary metrics
    report += `- **Total Regressions:** ${analysis.summary.totalRegressions}\n`;
    report += `- **Total Improvements:** ${analysis.summary.totalImprovements}\n`;
    report += `- **Critical Issues:** ${analysis.summary.criticalIssues}\n`;
    report += `- **New Test Suites:** ${analysis.newTests.length}\n`;
    report += `- **Removed Test Suites:** ${analysis.removedTests.length}\n\n`;
    
    // Status indicator
    if (analysis.summary.criticalIssues > 0) {
      report += `🚨 **Status: CRITICAL** - Immediate attention required\n\n`;
    } else if (analysis.summary.totalRegressions > 0) {
      report += `⚠️ **Status: REGRESSION DETECTED** - Review recommended\n\n`;
    } else if (analysis.summary.totalImprovements > 0) {
      report += `✅ **Status: IMPROVED** - Quality has increased\n\n`;
    } else {
      report += `✅ **Status: STABLE** - No significant changes\n\n`;
    }
  }
  
  if (!analysis.baseline) {
    // New Failures Section
    if (analysis.newFailures.length > 0) {
      report += `## 🚨 New Failures\n\n`;
      analysis.newFailures.forEach(failure => {
        const criticalFlag = failure.currentFailures / (failure.currentFailures + (currentResults.summary[failure.suite]?.passed || 0)) > 0.2 ? ' 🔥' : '';
        report += `### ${failure.suite}${criticalFlag}\n`;
        report += `- **Previous Failures:** ${failure.previousFailures}\n`;
        report += `- **Current Failures:** ${failure.currentFailures}\n`;
        report += `- **New Failure Count:** ${failure.newFailureCount}\n\n`;
      });
    }
    
    // Fixed Tests Section
    if (analysis.fixedTests.length > 0) {
      report += `## ✅ Fixed Tests\n\n`;
      analysis.fixedTests.forEach(fix => {
        report += `### ${fix.suite}\n`;
        report += `- **Previous Failures:** ${fix.previousFailures}\n`;
        report += `- **Current Failures:** ${fix.currentFailures}\n`;
        report += `- **Tests Fixed:** ${fix.fixedCount}\n\n`;
      });
    }
    
    // Performance Regressions Section
    if (analysis.performanceRegressions.length > 0) {
      report += `## ⏱️ Performance Regressions\n\n`;
      analysis.performanceRegressions.forEach(perf => {
        report += `### ${perf.suite}\n`;
        report += `- **Previous Avg Duration:** ${perf.previousDuration}ms\n`;
        report += `- **Current Avg Duration:** ${perf.currentDuration}ms\n`;
        report += `- **Slowdown:** ${perf.slowdownPercentage}%\n\n`;
      });
    }
    
    // New Tests Section
    if (analysis.newTests.length > 0) {
      report += `## 🆕 New Test Suites\n\n`;
      analysis.newTests.forEach(suite => {
        const stats = currentResults.summary[suite];
        const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
        report += `- **${suite}:** ${stats.total} tests, ${stats.passed} passed (${passRate}%)\n`;
      });
      report += `\n`;
    }
    
    // Removed Tests Section
    if (analysis.removedTests.length > 0) {
      report += `## 🗑️ Removed Test Suites\n\n`;
      analysis.removedTests.forEach(suite => {
        const stats = previousResults.summary[suite];
        report += `- **${suite}:** Had ${stats.total} tests\n`;
      });
      report += `\n`;
    }
  }
  
  // Detailed Test Results
  report += `## 📋 Detailed Test Results\n\n`;
  report += `| Test Suite | Total | Passed | Failed | Skipped | Pass Rate |\n`;
  report += `|------------|-------|--------|--------|---------|-----------||\n`;
  
  Object.entries(currentResults.summary).forEach(([suite, stats]) => {
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    const trend = !analysis.baseline && previousResults?.summary[suite] 
      ? (stats.failed > previousResults.summary[suite].failed ? ' 📈' : 
         stats.failed < previousResults.summary[suite].failed ? ' 📉' : ' ➡️')
      : '';
    
    report += `| ${suite}${trend} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.skipped} | ${passRate}% |\n`;
  });
  
  // Recommendations
  report += `\n## 💡 Recommendations\n\n`;
  
  if (analysis.baseline) {
    report += `- ✅ Baseline established successfully\n`;
    report += `- 📊 Monitor future runs for regressions\n`;
    report += `- 🎯 Consider improving test coverage if pass rates are low\n`;
  } else if (analysis.summary.criticalIssues > 0) {
    report += `- 🚨 **URGENT:** Address critical test failures immediately\n`;
    report += `- 🔍 Review recent code changes that may have introduced regressions\n`;
    report += `- 🛑 Consider blocking deployment until issues are resolved\n`;
  } else if (analysis.summary.totalRegressions > 0) {
    report += `- ⚠️ Investigate new test failures\n`;
    report += `- 🔍 Review recent changes for potential issues\n`;
    report += `- 📊 Monitor trends in upcoming builds\n`;
  } else {
    report += `- ✅ Build quality is stable or improved\n`;
    report += `- 🚀 Consider proceeding with deployment\n`;
    report += `- 📈 Keep monitoring for future regressions\n`;
  }
  
  report += `\n---\n`;
  report += `*Generated by Staryer Test Platform at ${new Date().toISOString()}*\n`;
  
  return report;
}

/**
 * Main analysis function
 */
async function main() {
  try {
    console.log('🔍 Staryer Regression Analysis Tool\n');
    
    if (!currentDir) {
      throw new Error('Current results directory is required (--current=path)');
    }
    
    // Load test results
    console.log('📊 Loading test results...');
    const previousResults = previousDir ? loadTestResults(previousDir) : null;
    const currentResults = loadTestResults(currentDir);
    
    if (!currentResults) {
      throw new Error('Could not load current test results');
    }
    
    // Analyze regressions
    const analysis = analyzeRegressions(previousResults, currentResults);
    
    // Generate report
    const report = generateRegressionReport(analysis, previousResults, currentResults);
    
    // Write report
    if (outputFile === 'regression-analysis.md') {
      // Append to existing file
      fs.appendFileSync(outputFile, '\n' + report);
    } else {
      fs.writeFileSync(outputFile, report);
    }
    
    console.log(`✅ Regression analysis completed`);
    console.log(`📝 Report saved to: ${outputFile}`);
    
    // Summary output
    if (analysis.baseline) {
      console.log('🆕 Baseline established');
    } else {
      console.log(`📊 Analysis Summary:`);
      console.log(`   - Regressions: ${analysis.summary.totalRegressions}`);
      console.log(`   - Improvements: ${analysis.summary.totalImprovements}`);
      console.log(`   - Critical Issues: ${analysis.summary.criticalIssues}`);
    }
    
    // Exit with appropriate code
    if (analysis.summary?.criticalIssues > 0) {
      console.log('🚨 Critical issues detected');
      process.exit(2); // Critical issues
    } else if (analysis.summary?.totalRegressions > 0) {
      console.log('⚠️ Regressions detected');
      process.exit(1); // Non-critical regressions
    } else {
      console.log('✅ No regressions detected');
      process.exit(0); // Success
    }
    
  } catch (error) {
    console.error('❌ Regression analysis failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadTestResults,
  analyzeRegressions,
  generateRegressionReport
};
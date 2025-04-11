const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

const RELEASE_VERSION = '4.7.0';
// Define the log folder and log file paths
const logFolderPath = path.join(__dirname, 'generated-logs');
const logFilePath = path.join(logFolderPath, `${RELEASE_VERSION}-unit-tests.log`);

// Ensure the logs folder exists
if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
}

// Execute the `npm run test` command and capture its output
exec('npm run test', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing npm run test: ${error.message}`);
        return;
    }

    // Write the output to the log file
    fs.writeFileSync(logFilePath, stdout + stderr, 'utf8');
    console.log(`Log file created at: ${logFilePath}`);
});

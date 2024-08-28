//start-dev.js

import { config as dotenvConfig } from 'dotenv';
//import ngrok from 'ngrok';
import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

dotenvConfig({ path: '.env.development' });

(async function() {
  const port = process.env.PORT || 3000;

  try {
    // Start ngrok and get the public URL
    // const url = await ngrok.connect(3000);
    // console.log(`ngrok URL: ${url}`);

    // // Read the .env.development file
    // const envFilePath = '.env.development';
    // let envFileContent = readFileSync(envFilePath, 'utf8');

    // // Replace or add the APPLICATION_URL variable
    // const ngrokUrlPattern = /^APPLICATION_URL=.*$/m;
    // if (ngrokUrlPattern.test(envFileContent)) {
    //   // If APPLICATION_URL exists, replace it with the new URL
    //   envFileContent = envFileContent.replace(ngrokUrlPattern, `APPLICATION_URL=${url}`);
    // } else {
    //   // If APPLICATION_URL does not exist, add it
    //   envFileContent += `\nAPPLICATION_URL=${url}\n`;
    // }

    // // Write the updated content back to the .env.development file
    // writeFileSync(envFilePath, envFileContent);

    // // Set the APPLICATION_URL environment variable for the current process
    // process.env.APPLICATION_URL = url;

    // Start the application with nodemon
    const cmd = `node src/app.js`;
    const appProcess = exec(cmd);

    appProcess.stdout.on('data', (data) => {
      console.log(data);
    });

    appProcess.stderr.on('data', (data) => {
      console.error(data);
    });

  } catch (error) {
    console.error('Error starting ngrok:', error);
  }
})();

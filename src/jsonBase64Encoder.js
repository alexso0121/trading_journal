/**
 * Reads a JSON file and converts its contents to a Base64-encoded string.
 *
 * Usage:
 *   node jsonBase64Encoder.js
 *   node jsonBase64Encoder.js firebase-credential-dev.json
 *   node jsonBase64Encoder.js ./credentials/prod-service-account.json
 *
 * If no filename is provided, it defaults to:
 *   firebase-credential-dev.json
 *
 * The generated Base64 string is printed to the console and can be used
 * as an environment variable or CI/CD secret.
 */

const fs = require("fs");
const path = require("path");

// Use the first command-line argument or fall back to the default file
const fileName = process.argv[2] || "firebase-credential-dev.json";
const filePath = path.resolve(fileName);

try {
    const json = fs.readFileSync(filePath, "utf8");
    const base64 = Buffer.from(json, "utf8").toString("base64");

    console.log(`File: ${filePath}`);
    console.log("\n=== Base64 ===\n");
    console.log(base64);
} catch (err) {
    console.error(`Failed to read file: ${filePath}`);
    console.error(err.message);
    process.exit(1);
}
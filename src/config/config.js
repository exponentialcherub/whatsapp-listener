const fs = require("fs");
const path = require("path");

function loadConfig() {
  const filePath = path.join(__dirname, "config.json");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

module.exports.loadConfig = loadConfig;

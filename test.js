const tilde = require(".");
const path = require("path");
const fs = require("fs");

let bot = new tilde();

bot.addModification("core", require(path.join(__dirname, "modifications", "core.js")));
bot.addModification("utilities", require(path.join(__dirname, "modifications", "utilities.js")));
bot.addModification("admin", require(path.join(__dirname, "modifications", "admin.js")), {dm: false});
bot.addModification("music", require(path.join(__dirname, "modifications", "music.js")), {dm: false});
bot.addModification("minigames", require(path.join(__dirname, "modifications", "minigames.js")));
bot.addModification("cleverbot", require(path.join(__dirname, "modifications", "cleverbot.js")));
bot.addModification("mafia", require(path.join(__dirname, "modifications", "mafia.js")), {dm: false});

bot.addModification("debug", function(modification, bot) {

  modification.registerCommand("command", function(member, command, message) {
    message.channel.send(`\`\`\`json\n${JSON.stringify(command)}\`\`\``);
  }, {dm: true});

  modification.registerCommand("data", function(member, command, message) {
    message.channel.send(`Guild user data: ${JSON.stringify(member.data)}`);
    message.channel.send(`Guild data: ${JSON.stringify(member.guild.data)}`);
    message.channel.send(`Global data: ${JSON.stringify(bot.data)}`);
  }, {dm: true});

});

bot.login(fs.readFileSync(path.join(__dirname, "token"), "utf-8"));


const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.on("line", function(line) {
  try {
    console.log(eval(line));
  } catch (error) {
    console.log(error);
  }
});

process.on("unhandledRejection", console.error);
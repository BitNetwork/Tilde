const tilde = require(".");
const path = require("path");

let bot = new tilde();

bot.addModification("core", require(path.join(__dirname, "modifications", "core.js")));
bot.addModification("music", require(path.join(__dirname, "modifications", "music.js")), {dm: false});

bot.addModification("debug", function(modification, bot) {

  modification.registerCommand("data", function(member, command, message) {
    message.channel.send(`Guild user data: ${JSON.stringify(member.data)}`);
    message.channel.send(`Guild data: ${JSON.stringify(member.guild.data)}`);
    message.channel.send(`Global data: ${JSON.stringify(bot.data)}`);
  }, {dm: true});

});

bot.login("MjY4MjMwNjYzMDI1NTkwMjc0.C1sojA.tmLZPrM8DTogi6Ww1PUEpJpjwV8");


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

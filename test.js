const tilde = require(".");
const path = require("path");

let bot = new tilde();

bot.addModification("core", require(path.join(__dirname, "modifications", "core.js")));
bot.addModification("music", require(path.join(__dirname, "modifications", "music.js")), {dm: false});

bot.login("MzE1Mjc5NjkzNTg0NzkzNjAw.DAEanQ.OUbdQxZzHqLA9SR-7CoHonekh54");


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

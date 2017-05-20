const tilde = require(".");

let bot = new tilde();
bot.addModification("test", function(modification) {
  console.log("testing...");
  modification.registerCommand("ping", function() {
    console.log("pong");
  });
});
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

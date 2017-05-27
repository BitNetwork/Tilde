module.exports = function(modification, bot) {
  const cleverbot = require("cleverbot.io");
  let clever = new cleverbot("", ""); // Insert your keys here from cleverbot.io (api user, api keys)

  clever.setNick("discordbot");

  clever.create(function(error, session) {

    modification.registerCommand("clever", function(member, command, message) {
      let guild = member.guild;
      if (command.params.length < 1) {
        message.channel.send(`\`\`\`${guild.data.prefix}clever [prompt]\nSends prompt to cleverbot.\nprompt | text to send\`\`\``);
        return;
      }

      clever.ask(command.params.join(" "), function(error, response) {
        message.channel.send(response);
      });
    }, {dm: true});

  });
};
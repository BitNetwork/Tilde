module.exports = function(modification, bot) {
  modification.registerCommand("prefix", function(member, command, message) {
    let guild = member.guild;
    function help() {
      message.channel.send(`\`\`\`${guild.data.prefix}prefix [prefix] [-h --help] [-d --default] [-e --empty]\nChanges the bot prefix.\nprefix | new prefix\n-h --help | shows this help text\n-d --default | change to default prefix\n-e --empty | change to empty prefix.\`\`\``);
    }

    if (command.switches["h"] !== undefined || command.switches["help"] !== undefined) {
      help();
    } else if (command.switches["d"] !== undefined || command.switches["default"] !== undefined) {
      guild.data.prefix = bot.data.prefix;
      message.channel.send("Prefix set to default.");
    } else if (command.switches["e"] !== undefined || command.switches["empty"] !== undefined) {
      guild.data.prefix = "";
      message.channel.send("Prefix set to none.");
    } else if (command.params[0] !== undefined) {
      guild.data.prefix = command.params[0];
      message.channel.send(`Prefix set to ${command.params[0]}.`);
    } else {
      help()
    }
  });

  modification.registerCommand("export", function(member, command, message) {

  });
};
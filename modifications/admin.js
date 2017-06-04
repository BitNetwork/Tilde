module.exports = function(modification, bot) {
  modification.registerCommand("prefix", function(member, command, message) {
    let guild = member.guild;
    function help() {
      message.channel.send(`\`\`\`${guild.data.prefix}prefix [prefix] [-h --help] [-d --default] [-e --empty]\nChanges the bot prefix.\nprefix | new prefix\n-h --help | shows this help text\n-d --default | change to default prefix\n-e --empty | change to empty prefix\`\`\``);
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
      help();
    }
  });

  modification.on("ready", function(guild) {
    guild.data.adblock = false;
  });

  modification.registerCommand("adblock", function(member, command, message) {
    let guild = member.guild;
    function help() {
      message.channel.send(`\`\`\`${guild.data.prefix}adblock [-h --help] [--on] [--off]\nChanges the status of adblock.\n-h --help | shows this help text\n--on | enable the adblocker\n--off | disable the adblocker\`\`\``);
    }

    if (command.switches["h"] !== undefined || command.switches["help"] !== undefined) {
      help();
    } else if (command.switches["on"] !== undefined) {
      guild.data.adblock = true;
      message.channel.send("Adblock enabled.");
    } else if (command.switches["off"] !== undefined) {
      guild.data.adblock = false;
      message.channel.send("Adblock disabled.");
    } else {
      help();
    }
  });

  bot.client.on("message", function(message) {
    if (bot.guilds[message.guild.id].data.adblock && message.content.search(/discord\.gg\/[^]*/) !== -1) {
      console.log("a");
      if (message.deletable) {
        message.delete().then(function(message) {
          message.channel.send("No advertising.");
        });
      }
    }
  });

  modification.registerCommand("export", function(member, command, message) {
    let guild = member.guild;
    let data = JSON.stringify(guild.data);

    message.channel.sendFile((new Buffer(data)), "export.json");
  });
};
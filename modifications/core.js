module.exports = function(modification, bot) {

  modification.registerCommand("help", function(member, command, message) {
    let guild = member.guild;

    let newMessage = "";
    for (let modificationName in bot.modifications) {
      let modificationLoop = bot.modifications[modificationName];
      if (modificationLoop.active === false || (guild.dm ? !modificationLoop.dm : false)) {
        continue;
      }

      newMessage += `**${modificationLoop.name.substring(0, 1).toUpperCase() + modificationLoop.name.substring(1)}**\n`;
      for (let commandName in modificationLoop.commands) {
        let commandLoop = modificationLoop.commands[commandName];
        if (commandLoop.active === false || (guild.dm ? !commandLoop.dm : false)) {
          continue;
        }

        newMessage += command.prefix + commandLoop.name + "\n";
      }
      newMessage += "\n";
    }
    newMessage = newMessage.substring(0, newMessage.length - 2);
    message.channel.send(newMessage);
  }, {dm: true});

  modification.registerCommand("echo", function(member, command, message) {
    if (command.params.length < 1) {
      message.channel.send("```" + command.prefix + "echo [text]\n\nEchos text back to chat.```");
      return;
    }
    message.channel.send(command.params.join(" "));
  }, {dm: true});

  modification.registerCommand("tts", function(member, command, message) {
    if (command.params.length < 1) {
      message.channel.send("```" + command.prefix + "tts [text]\n\nSpeaks text back to chat using text-to-speech.```");
      return;
    }
    message.channel.send(command.params.join(" "), {tts: true});
  });

  modification.registerCommand("invite", function(member, command, message) {
    message.channel.send("Offical guild: https://discord.gg/Uzkx7jr");
  }, {dm: true});

  modification.registerCommand("github", function(member, command, message) {
    message.channel.send("Github repository: https://github.com/bitnetwork/tilde-bot");
  }, {dm: true});

  modification.registerCommand("ping", function(member, command, message) {
    let incomingPing = Date.now() - message.createdTimestamp;
    let outgoingPing = Date.now();
    message.channel.send("Pong!\nIncoming: " + incomingPing + "ms").then(function(createdMessage) {
      outgoingPing = createdMessage.createdTimestamp - outgoingPing;
      createdMessage.edit(createdMessage.content + "\nOutgoing: " + outgoingPing + "ms\nTotal: " + (incomingPing + outgoingPing) + "ms");
    });
  }, {dm: true});

  modification.registerCommand("pong", function(member, command, message) {
    let incomingPing = Date.now() - message.createdTimestamp;
    let outgoingPing = Date.now();
    message.channel.send("Ping!\nIncoming: " + incomingPing + "ms").then(function(createdMessage) {
      outgoingPing = createdMessage.createdTimestamp - outgoingPing;
      createdMessage.edit(createdMessage.content + "\nOutgoing: " + outgoingPing + "ms\nTotal: " + (incomingPing + outgoingPing) + "ms");
    });
  }, {dm: true});

};

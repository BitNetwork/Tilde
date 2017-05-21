module.exports = function(modification, bot) {

  modification.registerCommand("echo", function(guild, command, message) {
    if (command.params.length < 1) {
      message.channel.sendMessage("```" + command.prefix + "echo [text]\n\nEchos text back to chat.```");
      return;
    }
    message.channel.send(command.params.join(" "));
  }, {dm: true});

  modification.registerCommand("tts", function(guild, command, message) {
    if (command.params.length < 1) {
      message.channel.send("```" + me.prefix + "tts [text]\n\nSpeaks text back to chat using text-to-speech.```");
      return;
    }
    message.channel.send(command.params.join(" "), {tts: true});
  });

  modification.registerCommand("ping", function(guild, command, message) {
    let incomingPing = Date.now() - message.createdTimestamp;
    let outgoingPing = Date.now();
    message.channel.send("Incoming: " + incomingPing + "ms").then(function(createdMessage) {
      outgoingPing = createdMessage.createdTimestamp - outgoingPing;
      createdMessage.edit(createdMessage.content + "\nOutgoing: " + outgoingPing + "ms\nTotal: " + (incomingPing + outgoingPing) + "ms");
    });
  }, {dm: true});

};

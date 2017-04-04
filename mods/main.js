{
  echo: {
    name: "echo",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "echo [text]\n\nEchos text back to chat.```");
        return;
      }
      message.channel.sendMessage(command.params.join(me.seperator));
    }
  },
  tts: {
    name: "tts",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "tts [text]\n\nSpeaks text back to chat using text-to-speech.```");
        return;
      }
      message.channel.sendMessage(command.params.join(me.seperator), {tts: true});
    }
  },
  ping: {
    name: "ping",
    runtime: function(message, client) {
      var incomePing = Date.now() - message.createdTimestamp;
      var outgoingPing = Date.now();
      message.channel.sendMessage("Incoming: " + incomePing + "ms").then(function(createdMessage) {
        outgoingPing = createdMessage.createdTimestamp - outgoingPing;
        createdMessage.edit(createdMessage.content + "\nOutgoing: " + outgoingPing + "ms\nTotal: " + (incomePing + outgoingPing) + "ms");
      });
    }
  },
  embed: {
    name: "embed",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "embed [text]\n\nCreates an embed with the given text.```");
        return;
      }
      var embed = new lib_discord.RichEmbed();
      embed.setDescription(command.params.join(me.seperator));
      message.channel.sendEmbed(embed);
    }
  }
}

{
  pin: {
    name: "pin",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "pin [messageid]\n\nPins a message to a channel.```");
        return;
      }
      message.channel.fetchMessage(command.params[0]).then(function(message) {
        message.pin().then(function() {
          message.channel.sendMessage("Message pinned.");
        });
      }).catch(function(error) {
        message.channel.sendMessage("Message not found.");
      });
    }
  },
  unpin: {
    name: "unpin",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "unpin [messageid]\n\nUnpins a message to a channel.```");
        return;
      }
      message.channel.fetchMessage(command.params[0]).then(function(message) {
        message.unpin().then(function() {
          message.channel.sendMessage("Message unpinned.");
        });
      }).catch(function(error) {
        message.channel.sendMessage("Message not found.");
      });
    }
  },
  topic: {
    name: "topic",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "topic [text]\n\nEdits the for a channel.```");
        return;
      }
      message.channel.setTopic(command.params.join(me.seperator));
    }
  },
  position: {
    name: "position",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1 || command.params[0].match(/^\d*$/) === null) {
        message.channel.sendMessage("```" + me.prefix + "position [position]\n\nRe-positions the channel in the channel list.```");
        return;
      }
      message.channel.setPosition(parseInt(command.params[0]));
    }
  },
  clone: {
    name: "clone",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "clone [name]\n\nClones the current channel into a new channel.```");
        return;
      }

      if (command.params[0].length > 100) {
        message.channel.sendMessage("That name is too long.");
        return;
      }

      if (command.params[0].length < 2) {
        message.channel.sendMessage("That name is too short.");
        return;
      }

      if (command.params[0].match(/^[A-Za-z_-\d]*$/) === null) {
        message.channel.sendMessage("That name is invalid.");
        return;
      }

      message.channel.clone(command.params[0]).then(function() {
        message.channel.sendMessage("Channel cloned.");
      });
    }
  },
  clear: {
    name: "clear",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "clear [amount]\n\nClears recent messages from a channel.```");
        return;
      }

      var amount = 10;
      if (command.params[0].match(/^\d*$/) !== null) {
        amount = parseInt(command.params[0]);
      }

      if (amount > 100) {
        message.channel.sendMessage("I can't delete that many messages.");
        return;
      }

      message.channel.bulkDelete(amount).catch(function(error) {
        message.channel.sendMessage("I had some trouble deleting those messages.");
      });
    }
  },
  kick: {
    name: "kick",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1 || parseMention(command.params[0]) === null) {
        message.channel.sendMessage("```" + me.prefix + "kick [user]\n\nKicks a member from this guild.```");
        return;
      }

      var target = message.guild.member(parseMention(command.params[0]));

      if (target === null) {
        message.channel.sendMessage("Member not found.");
        return;
      }

      if (target.kickable === false) {
        message.channel.sendMessage("I can't kick that member.");
        return;
      }

      target.kick().then(function() {
        message.channel.sendMessage("Member kicked.");
      });
    }
  }
}

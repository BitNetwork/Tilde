{
  game: {
    name: "game",
    runtime: function(message, client) {
      if (processCommand(message.content).params.length === 0) {
        message.channel.sendMessage("```" + me.prefix + "game [game]\n\nChanges the current game for this bot.```");
        return;
      }
      client.user.setGame(processCommand(message.content).params.join(me.seperator));
    }
  },
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
  voiceclone: {
    name: "voiceclone",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "voiceclone [name]\n\nClones the current connected voice channel into a new channel.```");
        return;
      }

      if (typeof message.member.voiceChannel === "undefined") {
        message.channel.sendMessage(makeMention(message.author.id) + " You don't appear to be in a voice channel.");
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

      message.member.voiceChannel.clone(command.params[0]).then(function() {
        message.channel.sendMessage("Voice channel cloned.");
      });
    }
  },
  clear: {
    name: "clear",
    runtime: function(message, client) {
      function help() {
        message.channel.sendMessage("```" + me.prefix + "clear [amount 1-100]\n\nClears recent messages from a channel.```");
      }
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        help();
        return;
      }

      var amount = 10;
      if (command.params[0].match(/^\d*$/) === null) {
        help();
        return;
      }
      amount = parseInt(command.params[0]);

      if (amount > 100) {
        message.channel.sendMessage("I can't delete that many messages.");
        return;
      }

      message.channel.bulkDelete(amount).catch(function(error) {
        message.channel.sendMessage("I had some trouble deleting those messages.");
      });
    }
  },
  permission: {
    name: "permission",
    startup: function(client, data) {
      data.bin.perm = {};
    },
    runtime: function(message, client, data) {
      var command = processCommand(message.content);
      if (command.params.length < 2) {
        message.channel.sendMessage("```" + me.prefix + "permission [command] [role]\n\nAllows or blocks the usage of a command by role.```");
        return;
      }

      var target = findCommand(command.params[0]);
      if (target === null) {
        message.channel.sendMessage("Command not found.");
        return;
      }

      var role = message.guild.roles.get(parseRoleMention(command.params[1]));
      if (typeof role === "undefined") {
        if (command.params[1] === "@everyone") {
          role = message.guild.roles.find("name", command.params[1]);
        } else {
          message.channel.sendMessage("Role not found.");
          return;
        }
      }

      data.bin.perm[target.name] = role.id;
      message.channel.sendMessage("Permission status updated.");
    },
    commandvalidate: function(message, client, data) {
      var command = processCommand(message.content);
      if (typeof data.bin.perm[command.command] !== "string") {
        return true;
      } else if (message.member.highestRole.comparePositionTo(message.guild.roles.get(data.bin.perm[command.command])) >= 0) {
        return true;
      }
      return false;
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

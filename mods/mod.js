{
  pin: {
    name: "pin",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "pin [messageid]\n\nPins a message to a channel.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_MESSAGES") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      }

      message.channel.fetchMessage(command.params[0]).then(function(pinnedMessage) {
        pinnedMessage.channel.fetchPinnedMessages().then(function(pinnedMessages) {
          if (pinnedMessages.has(pinnedMessage.id) === false) {
            pinnedMessage.pin().then(function() {
              message.channel.sendMessage("Message pinned.");
            });
          } else {
            message.channel.sendMessage("Message already pinned.");
          }
        });
      }, function(error) {
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
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_MESSAGES") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      }

      message.channel.fetchMessage(command.params[0]).then(function(pinnedMessage) {
        pinnedMessage.channel.fetchPinnedMessages().then(function(pinnedMessages) {
          if (pinnedMessages.has(pinnedMessage.id)) {
            pinnedMessage.unpin().then(function() {
              message.channel.sendMessage("Message unpinned.");
            });
          } else {
            message.channel.sendMessage("Message not pinned.");
          }
        });
      }, function(error) {
        message.channel.sendMessage("Message not found.");
      });
    }
  },
  react: {
    name: "react",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 2) {
        message.channel.sendMessage("```" + me.prefix + "react [messageid] [emoji]\n\nReacts to a message using an emoji.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("ADD_REACTIONS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      }

      message.channel.fetchMessage(command.params[0]).then(function(message) {
        message.react(command.params[1]);
      }, function(error) {
        message.channel.sendMessage("Message not found.");
      });
    }
  },
  topic: {
    name: "topic",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "topic [text]\n\nEdits the topic for a channel.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
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
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      }

      message.channel.setPosition(parseInt(command.params[0]));
    }
  },
  createtext: {
    name: "createtext",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "createtext [name]\n\nCreates a new channel.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      } else if (command.params[0].length > 100) {
        message.channel.sendMessage("That name is too long.");
        return;
      } else if (command.params[0].length < 2) {
        message.channel.sendMessage("That name is too short.");
        return;
      } else if (command.params[0].match(/^[A-Za-z_-\d]*$/) === null) {
        message.channel.sendMessage("That name is invalid.");
        return;
      }

      message.guild.createChannel(command.params[0], "text").then(function() {
        message.channel.sendMessage("Channel created.");
      });
    }
  },
  textclone: {
    name: "textclone",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "textclone [name]\n\nClones the current channel into a new channel.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      } else if (command.params[0].length > 100) {
        message.channel.sendMessage("That name is too long.");
        return;
      } else if (command.params[0].length < 2) {
        message.channel.sendMessage("That name is too short.");
        return;
      } else if (command.params[0].match(/^[A-Za-z_-\d]*$/) === null) {
        message.channel.sendMessage("That name is invalid.");
        return;
      }

      message.channel.clone(command.params[0]).then(function() {
        message.channel.sendMessage("Channel cloned.");
      });
    }
  },
  textdelete: {
    name: "textdelete",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      }

      message.channel.delete();
    }
  },
  createvoice: {
    name: "createvoice",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "createvoice [name]\n\nCreates a new voice channel.```");
        return;
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      } else if (command.params[0].length > 100) {
        message.channel.sendMessage("That name is too long.");
        return;
      } else if (command.params[0].length < 2) {
        message.channel.sendMessage("That name is too short.");
        return;
      } else if (command.params[0].match(/^[A-Za-z_-\d]*$/) === null) {
        message.channel.sendMessage("That name is invalid.");
        return;
      }

      message.guild.createChannel(command.params[0], "voice").then(function() {
        message.channel.sendMessage("Voice channel created.");
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
      } else if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      } else if (typeof message.member.voiceChannel === "undefined") {
        message.channel.sendMessage(makeMention(message.author.id) + " You don't appear to be in a voice channel.");
        return;
      } else if (command.params[0].length > 100) {
        message.channel.sendMessage("That name is too long.");
        return;
      } else if (command.params[0].length < 2) {
        message.channel.sendMessage("That name is too short.");
        return;
      }

      message.member.voiceChannel.clone(command.params[0]).then(function() {
        message.channel.sendMessage("Voice channel cloned.");
      });
    }
  },
  voicedelete: {
    name: "voicedelete",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (message.guild.members.get(client.user.id).hasPermission("MANAGE_CHANNELS") === false) {
        message.channel.sendMessage("I don't have that permission.");
        return;
      } else if (typeof message.member.voiceChannel === "undefined") {
        message.channel.sendMessage(makeMention(message.author.id) + " You don't appear to be in a voice channel.");
        return;
      }

      message.member.voiceChannel.delete().then(function() {
        message.channel.sendMessage("Voice channel deleted.");
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
  kick: {
    name: "kick",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "kick [user]\n\nKicks a member from this guild.```");
        return;
      }

      var target = parseMention(command.params[0], message.guild);

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

{
  exist: {
    name: "exist",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "exist [command]\n\nChecks if a command exists.```");
        return;
      }
      if (findCommand(command.params[0]) === null) {
        message.channel.sendMessage("Command not found.");
      } else {
        message.channel.sendMessage("Command exists.");
      }
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
  prefix: {
    name: "prefix",
    runtime: function(message, client) {
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "prefix [text]\n\nSets the bot prefix.```");
        return;
      }
      me.prefix = command.params.join(me.seperator);
      message.channel.sendMessage("Command prefix changed.");
    }
  }
}

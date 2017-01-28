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
  }
}

const discordjs = require("discord.js");

module.exports = function tilde() { // Oh yeah baby, that's right, ES6 classes. EDIT: Lol nope scratch that shit. There's no private variables.
  let client = new discordjs.Client();
  let me = this;

  // Properties
  this.client = client;
  this.token = null;
  this.modifications = {}; // Modifications
  this.guilds = {};
  this.bin = {}; // Global bot data storage, not saved
  this.data = { // Global bot data storage, must be JSON compatible (object, array, string, number, null), saved to file.
    prefix: "~"
  };

  // Classes
  this.Guild = function(id, options) {
    let guild = this;

    // Properties
    this.id = id;
    this.active = true;
    this.dm = false;
    this.bin = {}; // Per guild data storage, not saved
    this.data = { // Per guild data storage, must be JSON compatible (object, array, string, number, null), saved to file.
      prefix: me.data.prefix // Per guild prefix, default to global prefix
    };

    for (let option in options) {
      this[option] = options[option];
    }
  }

  this.Modification = function(name, internal, options) { // Modification "class"
    let modification = this;

    // Properties
    this.name = name;
    this.active = true;
    this.internal = internal || null;
    this.commands = {};
    this.onready = null;

    for (let option in options) {
      this[option] = options[option];
    }

    // Methods
    this.registerCommand = function(name, runtime, options) {
      modification.commands[name] = new me.Command(name, modification, runtime, options);
      return modification.commands[name];
    };

    internal(modification);
  };

  this.Command = function(name, modification, runtime, options) {
    let command = this;

    // Properties
    this.name = name;
    this.modification = (modification === undefined ? null : runtime);
    this.active = true;
    this.dm = false;
    this.runtime = (runtime === undefined ? null : runtime);

    for (let option in options) {
      command[option] = options[option];
    }

  };

  // Private methods
  let addGuild = function(id, options) { // Guild creator
    me.guilds[id] = new me.Guild(id, options);
  };

  let processCommand = function(prefix, commandText) { // Internal command processer
    let command = commandText.substring(prefix.length).split(" ")[0];
    let params = commandText.substring(prefix.length + command.length).split(" ").slice(1);
    let stringParams = commandText.substring(prefix.length + command.length).split("\"");

    if (stringParams.length <= 1) {
      return {prefix: prefix, command: command, params: params};
    }

    var i = 0;
    while (i < stringParams.length) {
      if (stringParams[i] === " " || stringParams[i] === "") {
        stringParams.splice(i, 1);
        i++;
      } else {
        stringParams[i] = stringParams[i].trim();
        i += 2;
      }
    }

    return {prefix: prefix, command: command, params: stringParams};
  };

  // Methods
  this.addModification = function(name, internal, options) {
    me.modifications[name] = new me.Modification(name, internal, options);
    return me.modifications[name];
  };

  this.login = function(token) {
    if (token === undefined) {
      token = this.token;
    } else {
      this.token = token;
    }

    this.client.login(token);
    return this;
  };


  client.on("ready", function() {
    client.guilds.forEach(function(guild) {
      addGuild(guild.id);
    });

    client.channels.filter(function(channel) { return channel.type === "dm"; }).forEach(function(channel) {
      addGuild(channel.id, {dm: true})
    });
  });

  client.on("channelCreate", function(guild) {
    addGuild(guild.id);
  });

  me.client.on("channelCreate", function(channel) {
    if (channel.type === "dm") {
      addGuild(channel.id, {dm: true});
    }
  });

  client.on("message", function(message) {
    let id = message.channel.id; // Either the guild id or the dm/user id
    if (message.guild !== null) {
      id = message.guild.id;
    }

    let guild = me.guilds[id]
    let prefix = guild.data.prefix;

    if (message.content.substring(0, prefix.length) !== prefix || guild.active === false) {
      return;
    }

    let processedCommand = processCommand(prefix, message.content);
    console.log(processedCommand); // Debug & lazy logging

    for (let modificationName in me.modifications) {
      let modification = me.modifications[modificationName];
      if (modification.active === false) {
        continue;
      }

      for (let commandName in modification.commands) {
        let command = modification.commands[commandName];
        if (command.active === false) {
          continue;
        }

        if (command.name === processedCommand.command && command.runtime !== null) {
          command.runtime(guild, command, processedCommand); // This is ugly... might make it look prettier later... maybe... someday.
        }

      }
    }

  });
};

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
    this.dm = false;
    this.members = {};
    this.bin = {}; // Per guild data storage, not saved
    this.data = { // Per guild data storage, must be JSON compatible (object, array, string, number, null), saved to file.
      prefix: me.data.prefix // Per guild prefix, default to global prefix
    };

    for (let option in options) {
      this[option] = options[option];
    }

    // Methods
    this.registerMember = function(id, options) {
      guild.members[id] = new me.Member(id, guild, options);
      return guild.members[id];
    };
  };

  this.Member = function(id, guild, options) {
    let member = this;

    // Properties
    this.id = id;
    this.guild = (guild === undefined ? null : guild);
    this.bin = {};
    this.data = {};

    for (let option in options) {
      this[option] = options[option];
    }
  };

  this.Modification = function(name, internal, options) {
    let modification = this;

    // Properties
    this.name = name;
    this.dm = true;
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

    this.on = function(name, internal) {
      modification["on" + name] = internal;
      return modification["on" + name];
    };

    internal(modification, me);

    client.guilds.forEach(function(guild) {
      let dataGuild = me.guilds[guild.id];

      if (me.client.readyTimestamp !== null) {
        modification.onready(dataGuild);
      }
    });

    client.channels.filter(function(channel) { return channel.type === "dm"; }).forEach(function(channel) {
      let dataGuild = me.guilds[channel.id];

      if (modification.dm === false) {
        return;
      }

      if (me.client.readyTimestamp !== null) {
        modification.onready(dataGuild);
      }
    });

  };

  this.Command = function(name, modification, runtime, options) {
    let command = this;

    // Properties
    this.name = name;
    this.modification = (modification === undefined ? null : modification);
    this.dm = false;
    this.runtime = (runtime === undefined ? null : runtime);

    for (let option in options) {
      command[option] = options[option];
    }
  };

  this.ProcessedCommand = function(prefix, commandText) {
    let command = commandText.substring(prefix.length);
    let options = "";
    if (command.search(" ") !== -1) { // If the command has options
      command = commandText.substring(prefix.length, commandText.search(" "));
      options = commandText.substring(prefix.length + command.length + 1);
    }

    let params = [""];
    let currentParam = 0;
    let inString = false;
    for (var i = 0; i < options.length; i++) {
      let char = options[i];
      if (char === "\"") {
        inString = !inString;
        if (inString) {
          params[currentParam] = "";
        }
      } else if (inString) {
        params[currentParam] += char;
      } else if (char === " ") {
        currentParam++;
        params[currentParam] = "";
      } else {
        params[currentParam] += char;
      }
    }

    if (params.length === 1 && params[0] === "") {
      params = [];
    }

    this.prefix = prefix;
    this.command = command;
    this.options = options;
    this.params = params;
  };

  // Private methods
  let addGuild = function(id, members, options) { // Guild creator
    me.guilds[id] = new me.Guild(id, options);
    members.forEach(function(member) {
      // me.guilds[id].members[member.id] = new me.Member(member.id, me.guilds[id]);
      me.guilds[id].registerMember(member.id);
    });
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
      addGuild(guild.id, guild.members.filter(function(member) { return member.id !== client.user.id;}).array());

      for (let modificationName in me.modifications) {
        let modification = me.modifications[modificationName];
        let dataGuild = me.guilds[guild.id];

        if (modification.onready !== null) {
          modification.onready(dataGuild);
        }
      }
    });

    client.channels.filter(function(channel) { return channel.type === "dm"; }).forEach(function(channel) {
      addGuild(channel.id, [channel.recipient], {dm: true});

      for (let modificationName in me.modifications) {
        let modification = me.modifications[modificationName];
        let dataGuild = me.guilds[channel.id];

        if (modification.dm === false) {
          continue;
        }

        if (modification.onready !== null) {
          modification.onready(dataGuild);
        }
      }
    });
  });

  me.client.on("channelCreate", function(channel) {
    if (channel.type === "dm") {
      addGuild(channel.id, [channel.recipient], {dm: true});

      for (let modificationName in me.modifications) {
        let modification = me.modifications[modificationName];
        let guild = me.guilds[channel.id];

        if ( modification.dm === false) {
          continue;
        }

        if (modification.onready !== null) {
          modification.onready(guild, modification);
        }
      }
    }
  });

  client.on("guildMemberAdd", function(member) {
    let guild = me.guilds[member.guild.id];
    if (guild.members[member.id] === undefined) {
      let member = guild.registerMember(member.id, member.guild);
    }
  });

  client.on("message", function(message) {
    let id = message.channel.id; // Either the guild id or the dm/user id
    let dm = true;
    if (message.guild !== null) {
      id = message.guild.id;
      dm = false;
    }

    let guild = me.guilds[id];
    let member = guild.members[message.author.id];
    let prefix = guild.data.prefix;

    // https://cdn.discordapp.com/attachments/267126130039848970/317349504208601089/Screenshot_20170525-111211-01.jpg
    if (message.content.substring(0, prefix.length) !== prefix || guild.active === false || message.author.id === client.user.id) {
      return;
    }

    let processedCommand = new me.ProcessedCommand(prefix, message.content);
    console.log(processedCommand); // Debug & lazy logging

    for (let modificationName in me.modifications) {
      let modification = me.modifications[modificationName];
      if (modification.active === false || (dm === true ? !modification.dm : false)) {
        continue;
      }

      for (let commandName in modification.commands) {
        let command = modification.commands[commandName];
        if (command.active === false || (dm === true ? !command.dm : false)) {
          continue;
        }

        if (command.name === processedCommand.command && command.runtime !== null) {
          command.runtime(member, processedCommand, message); // This is ugly... might make it look prettier later... maybe... someday.
        }

      }
    }

  });
};

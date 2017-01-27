const lib_discord = require("discord.js");
const lib_ytdl = require("ytdl-core");
const lib_fs = require("fs");

function botInit() {
  var me = this;

  this.token = "";
  this.prefix = "~";
  this.seperator = " ";
  this.config = {};
  this.guild = {};

  function processCommand(commandText) {
    var command = commandText.substring(me.prefix.length).split(me.seperator)[0];
    var params = commandText.substring(me.prefix.length + command.length).split(me.seperator).slice(1);
    return {command: command, params: params};
  }

  /*function callListener(listener) {
    for (var key in me.commands) {
      if (typeof me.commands[key][listener] === "function") {
        me.commands[key][listener](client, me.guild[message.channel.guild.id]);
      }
    }
  }*/

  function makeMention(id) {
    return "<@" + id + ">";
  }

  function parseMention(mention) {
    return mention.match(/^<@!?(\d+)>$/) !== null ? mention.match(/^<@!?(\d+)>$/)[1] : null;
  }

  this.commands = {
    debug: {
      name: "debug",
      startup: function(client, data) {
        data.bin.asdf = "It kinda worked!";
      },
      runtime: function(message, client, data) {
        message.reply(data.bin.asdf);
      }
    },
    echo: {
      name: "echo",
      runtime: function(message, client) {
        if (processCommand(message.content).params.length < 1) {
          message.channel.sendMessage("```" + me.prefix + "echo [text]\n\nEchos text back to chat.```");
          return;
        }
        message.channel.sendMessage(processCommand(message.content).params.join(me.seperator));
      }
    },
    tts: {
      name: "tts",
      runtime: function(message, client) {
        if (processCommand(message.content).params.length < 1) {
          message.channel.sendMessage("```" + me.prefix + "tts [text]\n\nSpeaks text back to chat using text-to-speech.```");
          return;
        }
        message.channel.sendMessage(processCommand(message.content).params.join(me.seperator), {tts: true});
      }
    },
    react: {
      name: "react",
      runtime: function(message, client) {
        var command = processCommand(message.content);
        if (command.params.length < 2) {
          message.channel.sendMessage("```" + me.prefix + "react [messageid] [emoji]\n\nReacts to a message using an emoji.```");
          return;
        }
        message.channel.fetchMessage(command.params[0]).then(function(message) {
          message.react(command.params[1]);
        }).catch(function(error) {
          message.channel.sendMessage("Message not found.");
        });
      }
    },
    ping: {
      name: "ping",
      runtime: function(message, client) {
        message.channel.sendMessage("Pong!");
      }
    },
    game: {
      name: "game",
      runtime: function(message, client) {
        if (processCommand(message.content).params.length === 0) {
          message.channel.sendMessage("```" + me.prefix + "game [game]\n\nChanges the current game for this bot.```");
          return;
        }
        client.user.setGame(processCommand(message.content).params.join(me.seperator));
      }
    }
  };

  try {
    var data = lib_fs.readFileSync("./config.json", {encoding: "utf8"});
  } catch (error) {
    console.log("[Fatel] Error reading config file.");
    process.exit();
    return;
  }

  try {
    me.config = JSON.parse(data);
  } catch (error) {
    console.log("[Fatel] Error reading config file.");
    process.exit();
    return;
  }

  console.log("[Info] Config loaded.");

  if (typeof me.config.token === "undefined") {
    console.log("[Fatel] JSON.token field is missing.");
    process.exit();
    return;
  } else if (typeof me.config.token !== "string") {
    console.log("[Fatel] JSON.token field is invalid.");
    process.exit();
    return;
  } else {
    me.token = me.config.token;
  }

  if (typeof me.config.prefix === "undefined") {
    console.log("[Warn] JSON.prefix field is missing.");
  } else if (typeof me.config.prefix !== "string") {
    console.log("[Error] JSON.prefix field is invalid.");
  } else {
    me.prefix = me.config.prefix;
  }

  if (typeof me.config.mods === "undefined") {
    console.log("[Warn] JSON.mod field is missing.");
  } else if (typeof me.config.mods === "string" || typeof me.config.mods === "number") {
    console.log("[Error] JSON.mod field is invalid.");
  } else {

    for (var i=0; i<me.config.mods.length; i++) {

      try {
        var data = lib_fs.readFileSync(me.config.mods[i], {encoding: "utf8"});
      } catch (error) {
        console.log("[Error] Error reading mod <" + me.config.mods[i] + ">. Mod not loaded.");
        return;
      }

      try {
        var commands = eval("new Object(" + data + ");");
      } catch (error) {
        console.log("[Error] Error loading mod <" + me.config.mods[i] + ">. Mod not loaded.");
        return;
      }

      for (var command in commands) {
        me.commands[command] = commands[command];
      }

      console.log("[Info] Mod <" + me.config.mods[i] + "> successfully loaded.");
    }
  }

  var client = new lib_discord.Client();

  client.on("ready", function() {
    console.log("[Info] Server ready!");

    client.user.setGame("Discord");

    var startupCommands = [];
    for (var key in me.commands) {
      if (typeof me.commands[key].startup === "function") {
        startupCommands.push(me.commands[key].startup);
      }
    }

    client.guilds.forEach(function(guild) {
      me.guild[guild.id] = {
        bin: {},
        data: {}
      };

      for (var i=0; i<startupCommands.length; i++) {
        startupCommands[i](client, me.guild[guild.id]);
      }
    });
  });


  client.on("message", function(message) {

    // Logging messages for debugging
    var header = (typeof message.channel.guild === "object" ? message.channel.guild.name + "/" + message.channel.name : "DM") + ", " + message.author.username + "#" + message.author.discriminator + ": ";
    console.log(header + message.content.replace(/\n/g, "\n" + " ".repeat(header.length)));

    if (message.content.substring(0, me.prefix.length) !== me.prefix || message.author.id === client.user.id || message.author.bot || typeof message.channel.guild !== "object") {
      return;
    }

    var command = processCommand(message.content);
    // var command = message.content.substring(me.prefix.length).split(me.seperator)[0];
    // var params = message.content.split(me.seperator).slice(1);

    for (var key in me.commands) {
      if (me.commands[key].name === command.command && typeof me.commands[key].runtime === "function") {
        me.commands[key].runtime(message, client, me.guild[message.channel.guild.id]);
      }
    }

  });

  client.login(me.token); // Bot token. No stealies

}

var bot = new botInit();

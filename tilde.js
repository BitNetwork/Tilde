const lib_discord = require("discord.js");
const lib_ytdl = require("ytdl-core");
const lib_fs = require("fs");

function botInit() {
  var me = this;

  this.token = "";
  this.prefix = "~";
  this.seperator = " ";
  this.config = {};
  this.data = {};

  function processCommand(commandText) {
    var command = commandText.substring(me.prefix.length).split(me.seperator)[0];
    var params = commandText.substring(me.prefix.length + command.length).split(me.seperator).slice(1);
    return {command: command, params: params};
  }

  function findCommand(commandName) {
    for (var key in me.commands) {
      if (me.commands[key].name === commandName) {
        return me.commands[key];
      }
    }
    return null;
  }

  function callListener(listener, guild, message) {
    var results = [];
    for (var key in me.commands) {
      if (typeof me.commands[key][listener] === "function") {
        if (typeof message !== "undefined") {
          results.push(me.commands[key][listener](message, me.client, me.data[guild.id]));
        } else {
          results.push(me.commands[key][listener](me.client, me.data[guild.id]));
        }
      }
    }
    return results;
  }

  function makeMention(id) {
    return "<@" + id + ">";
  }

  function parseMention(mention) {
    return mention.match(/^<@!?(\d+)>$/) !== null ? mention.match(/^<@!?(\d+)>$/)[1] : null;
  }

  function makeRoleMention(id) {
    return "<@&" + id + ">";
  }

  function parseRoleMention(mention) {
    return mention.match(/^<@&(\d+)>$/) !== null ? mention.match(/^<@&(\d+)>$/)[1] : null;
  }

  function makeChannelMention(id) {
    return "<#" + id + ">";
  }

  function parseChannelMention(mention) {
    return mention.match(/^<#(\d+)>$/) !== null ? mention.match(/^<#(\d+)>$/)[1] : null;
  }

  this.commands = {
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
        break;
      }

      try {
        var commands = eval("new Object(" + data + ");");
      } catch (error) {
        console.log("[Error] Error loading mod <" + me.config.mods[i] + ">. Mod not loaded.");
        break;
      }

      for (var command in commands) {
        me.commands[command] = commands[command];
      }

      console.log("[Info] Mod <" + me.config.mods[i] + "> successfully loaded.");
    }
  }

  me.client = new lib_discord.Client();

  me.client.on("ready", function() {
    console.log("[Info] Server ready!");

    me.client.user.setGame("Discord");

    var startupCommands = [];
    for (var key in me.commands) {
      if (typeof me.commands[key].startup === "function") {
        startupCommands.push(me.commands[key].startup);
      }
    }

    me.client.guilds.forEach(function(guild) {
      me.data[guild.id] = {
        bin: {},
        data: {}
      };

      for (var i=0; i<startupCommands.length; i++) {
        startupCommands[i](me.client, me.data[guild.id]);
      }
    });
  });


  me.client.on("message", function(message) {

    if (message.content.substring(0, me.prefix.length) !== me.prefix || message.author.id === me.client.user.id || message.author.bot || typeof message.guild !== "object") {
      return; // Invalid syntax, message sent by self; message sent by a bot; in a dm, then return
    }

    var command = processCommand(message.content);
    var target = findCommand(command.command);

    if (target === null) {
      return; // Command doesn't exist
    }

    if (typeof target.runtime === "function" && callListener("commandvalidate", message.guild, message).filter(function(result) { return !result; }).length === 0) {
      target.runtime(message, me.client, me.data[message.guild.id]);
    }

  });

  me.client.login(me.token); // Bot token. No stealies

}

var bot = new botInit();

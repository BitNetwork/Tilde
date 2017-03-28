const lib_discord = require("discord.js");
const lib_ytdl = require("ytdl-core");
const lib_fs = require("fs");
const lib_readline = require("readline");

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
    var stringParams = commandText.substring(me.prefix.length + command.length).split("\"");
    var stringParams = [" ","SuperCell Bank"," 1400 ","aaa",""]
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
    stringParams;
    return {command: command, params: params, stringParams: stringParams};
  }

  function findCommand(commandName) {
    for (var key in me.commands) {
      if (me.commands[key].name === commandName) {
        return me.commands[key];
      }
    }
    return null;
  }

  function findData(dataName) {
    if (typeof me.data[dataName] !== "undefined") {
      return me.data[dataName];
    }
    return null;
  }

  function createData(dataName) {
    me.data[dataName] = {
      bin: {user: {}},
      data: {user: {}}
    };
    return me.data[dataName];
  }

  function createUserData(dataName, userName) {
    me.data[dataName].bin.user[userName] = {};
    me.data[dataName].data.user[userName] = {};
  }

  function callListener(listener, guild, main) {
    // Using main because some listeners give params other then a message
    var results = [];
    for (var key in me.commands) {
      if (typeof me.commands[key][listener] === "function") {
        if (typeof main !== "undefined") {
          results.push(me.commands[key][listener](main, me.client, me.data[guild.id]));
        } else {
          results.push(me.commands[key][listener](me.client, me.data[guild.id]));
        }
      }
    }
    return results;
  }

  function grabServerName(member) {
    return member.nickname !== null ? member.nickname : member.user.username;
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

  this.commands = {};

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

    for (var i = 0; i < me.config.mods.length; i++) {

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
        continue;
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

    me.client.guilds.forEach(function(guild) {
      createData(guild.id);
      callListener("startup", guild);
    });

    // Stupid DMs... gotta use a whole second block for them.
    me.client.channels.findAll("type", "dm").forEach(function(channel) {
      createData(channel.id);

      // ...and a stupid second listener.
      callListener("dmstartup", channel);
    });
  });


  me.client.on("message", function(message) {

    if (message.content.substring(0, me.prefix.length) !== me.prefix || message.author.id === me.client.user.id || message.author.bot) {
      return; // Invalid syntax, message sent by self; message sent by a bot; then return (it does allow DM messages)
    }

    var command = processCommand(message.content);
    var target = findCommand(command.command);

    if (target === null) {
      return; // Command doesn't exist
    }

    if (message.channel.type === "text" && typeof target.runtime === "function" && callListener("commandvalidate", message.guild, message).filter(function(result) { return !result; }).length === 0) {
      target.runtime(message, me.client, me.data[message.guild.id]);
    } else if (message.channel.type === "dm" && typeof target.dmruntime === "function" && callListener("dmcommandvalidate", message.channel, message).filter(function(result) { return !result; }).length === 0) {
      target.dmruntime(message, me.client, me.data[message.channel.id]);
    }

  });

  me.client.on("messageReactionAdd", function(messageReaction, user) {
    if (messageReaction.message.channel.type === "dm") {
      callListener("dmreactionadd", messageReaction.message.channel, [messageReaction, user]); // I DISPISE DM SUPPORT
    } else {
      callListener("reactionadd", messageReaction.message.guild, [messageReaction, user]);
    }
  });

  me.client.on("guildCreate", function(guild) {
    me.data[guild.id] = {
      bin: {},
      data: {}
    };
  });

  me.client.on("guildMemberAdd", function(member) {
    callListener("memberadd", member.guild, member);
  });

  me.client.on("channelCreate", function(channel) {
    if (channel.type === "dm") {
      // Must be a new DM
      me.data[channel.id] = {
        bin: {},
        data: {}
      };
    }
  });

  me.client.login(me.token); // Bot token. No stealies
}

var bot = new botInit();

const readline = lib_readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.on("line", function(line) {
  try {
    console.log(eval(line));
  } catch (error) {
    console.log(error);
  }
});

const lib_discord = require("discord.js");
const lib_ytdl = require("ytdl-core");

function botInit() {
  var me = this;
  
  this.token = "token";
  
  this.prefix = "~";
  this.seperator = " ";
  
  this.guild = {};
  
  function processCommand(commandText) {
    var command = commandText.substring(me.prefix.length).split(me.seperator)[0];
    var params = commandText.split(me.seperator).slice(1);
    return {command: command, params: params};
  }
  
  function makeMention(id) {
    return "<@" + id + ">";
  }
  
  this.commands = {
    debug: {
      name: "debug",
      runtime: function(message, client) {
        message.reply("???");
      }
    },
    echo: {
      name: "echo",
      runtime: function(message, client) {
        console.log(processCommand(message.content));
        message.channel.send(processCommand(message.content).params.join(me.seperator));
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
        client.user.setGame(processCommand(message.content).params.join(me.seperator));
      }
    },
    join: {
      name: "join",
      runtime: function(message, client, data) {
        if (typeof message.member.voiceChannel === "undefined") {
          message.channel.sendMessage(makeMention(message.author.id) + " You don't appear to be in a voice channel.");
          return;
        }
        message.member.voiceChannel.join().then(function(connection) {
          data.bin.voiceChannel = connection;
        });
      }
    },
    play: {
      name: "play",
      runtime: function(message, client, data) {
        if (typeof data.bin.voiceDispatcher !== "undefined") {
          data.bin.voiceDispatcher.resume();
          return;
        }
        
        if (processCommand(message.content).params.length === 0) {
          message.channel.sendMessage("```" + me.prefix + "play [yt video]\n\nPlays a song in your connected voice channel.```");
          return;
        }
        
        if (typeof message.member.voiceChannel === "undefined") {
          message.channel.sendMessage(makeMention(message.author.id) + " You don't appear to be in a voice channel.");
          return;
        }
        
        message.member.voiceChannel.join().then(function(connection) {
          //Get info with http://stackoverflow.com/q/38810536/3434588
          data.bin.voiceChannel = connection;
          
          var url = "https://www.youtube.com/watch?v=92f3RRkakO8";
          var youtubeUrlRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?(?:(?:youtube.com(?:(?::80)|(?::443))?\/watch\?v=)|(?:youtu.be(?:(?::80)|(?::443))?\/))([\w\d]{8,13})/;
          if (processCommand(message.content).params.length > 0 && processCommand(message.content).params[0].match(youtubeUrlRegex) !== null && processCommand(message.content).params[0].match(youtubeUrlRegex).length > 1) {
            url = "https://www.youtube.com/watch?v=" + processCommand(message.content).params[0].match(youtubeUrlRegex)[1];
          }
          
          var stream = lib_ytdl(url, {filter: "audioonly"});
          setTimeout(function(stream) {
            data.bin.voiceDispatcher = connection.playStream(stream, {seek: 0, volume: 1});
            data.bin.voiceDispatcher.on("end", function() {
              data.bin.voiceDispatcher = undefined;
            });
          }, 2500, stream);
        });
      }
    },
    pause: {
      name: "pause",
      runtime: function(message, client, data) {
        if (typeof data.bin.voiceDispatcher === "undefined") {
          message.channel.sendMessage("There's no music playing.");
          return;
        }
        data.bin.voiceDispatcher.pause();
      }
    },
    stop: {
      name: "stop",
      runtime: function(message, client, data) {
        if (typeof data.bin.voiceDispatcher === "undefined") {
          message.channel.sendMessage("There's no music playing.");
          return;
        }
        data.bin.voiceDispatcher.end();
        data.bin.voiceDispatcher = undefined;
      }
    },
    leave: {
      name: "leave",
      runtime: function(message, client, data) {
        if (typeof data.bin.voiceChannel === "undefined") {
          message.channel.sendMessage("I'm not in a voice channel.");
          return;
        }
        data.bin.voiceChannel.disconnect();
        data.bin.voiceChannel = undefined;
      }
    }
  };
}

var bot = new botInit();
var client = new lib_discord.Client();

client.on("ready", function() {
  console.log("Server ready!");
  client.user.setGame("Discord");
});


client.on("message", function(message) {
  
  // Logging messages for debugging
  var header = (typeof message.channel.guild === "object" ? message.channel.guild.name : "DM") + "/" + message.channel.name + ", " + message.author.username + "#" + message.author.discriminator + ": ";
  console.log(header + message.content.replace(/\n/g, "\n" + " ".repeat(header.length)));
  
  if (message.content.substring(0, bot.prefix.length) !== bot.prefix || message.author.id === client.user.id || typeof message.channel.guild !== "object") {
    return;
  }
  
  if (typeof bot.guild[message.channel.guild.id] === "undefined") {
    bot.guild[message.channel.guild.id] = {
      bin: {},
      data: {}
    };
  }
  
  var command = message.content.substring(bot.prefix.length).split(bot.seperator)[0];
  var params = message.content.split(bot.seperator).slice(1);
    
  for (var key in bot.commands) {
    if (bot.commands[key].name === command && typeof bot.commands[key].runtime === "function") {
      bot.commands[command].runtime(message, client, bot.guild[message.channel.guild.id]);
    }
  }

});

client.login(bot.token); // Bot token. No stealies

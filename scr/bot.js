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
    },
    music: {
      name: "music",
      startup: function(client, data) {
        data.bin.voiceChannel = null;
        data.bin.voiceDispatcher = null;
        data.bin.musicState = 0; // 0 = stopped, 1 = playing, 2 = paused
        data.bin.musicVolume = 1;
        data.bin.musicMuted = false;
        data.bin.playingMusic = null;
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
        if (data.bin.musicState === 2) {
          data.bin.voiceDispatcher.resume();
          data.bin.musicState = 1;
          message.channel.sendMessage("Music resumed.");
          return;
        }

        if (data.bin.musicState !== 0) {
          message.channel.sendMessage("There's already something playing.");
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
          // Get info with http://stackoverflow.com/q/38810536/3434588
          data.bin.voiceChannel = connection;

          var command = processCommand(message.content);
          var url = "";
          var youtubeUrlRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?(?:(?:youtube.com(?:(?::80)|(?::443))?\/watch\?v=)|(?:youtu.be(?:(?::80)|(?::443))?\/))([\w\d_-]{8,13})/;
          if (command.params.length > 0 && command.params[0].match(youtubeUrlRegex) !== null && command.params[0].match(youtubeUrlRegex).length > 1) {
            url = "https://www.youtube.com/watch?v=" + command.params[0].match(youtubeUrlRegex)[1];
          } else {
            message.channel.sendMessage("Music not found.");
            return;
          }

          data.bin.playingMusic = url;
          lib_ytdl.getInfo(url, function(error, info) {
            if (error) {
              message.channel.sendMessage("Music not found.");
              return;
            }

            var stream = lib_ytdl(url, {filter: "audioonly"});
            message.channel.sendMessage("Playing music...");

            setTimeout(function(stream) {
              data.bin.voiceDispatcher = connection.playStream(stream, {volume: data.bin.musicVolume});
              data.bin.voiceDispatcher.on("start", function() {
                data.bin.musicState = 1;
              });
              data.bin.voiceDispatcher.on("end", function() {
                data.bin.musicState = 0;
                data.bin.playingMusic = null;
                data.bin.voiceDispatcher = undefined;
              });
            }, 2500, stream);
          });
        });
      }
    },
    song: {
      name: "song",
      runtime: function(message, client, data) {
        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }

        lib_ytdl.getInfo(data.bin.playingMusic, function(error, info) {
          if (error) {
            message.channel.sendMessage("Error getting details.");
            return;
          }

          var embed = new lib_discord.RichEmbed();
          embed.setColor("#ff0000"); // Red... like YouTube ;)
          embed.setTitle(info.title);
          embed.setAuthor(info.author);
          embed.setImage(info.iurl);
          embed.setURL(info.loaderUrl);
          if (info.description.length > 250) {
            embed.setDescription("*" + info.description.substring(0, 247) + "...*");
          } else {
            embed.setDescription("*" + info.description.substring(0, 250) + "*");
          }
          var seconds = 0;
          var minutes = 0;
          var hours = 0;
          if (info.length_seconds < 60) { // Minute
            seconds = info.length_seconds;
          } else if (info.length_seconds < 3600) { // Hour
            seconds = info.length_seconds % 60;
            minutes = Math.floor(info.length_seconds / 60);
          } else {
            seconds = info.length_seconds % 3600 % 60;
            minutes = Math.floor(info.length_seconds % 3600 / 60);
            hours = Math.floor(info.length_seconds / 3600);
          }
          embed.addField("Length", (hours > 0 ? hours + " hour" + (hours > 1 ? "s" : "") : "") + " " + (minutes > 0 ? minutes + " minute" + (minutes > 1 ? "s" : "") : "") + " " + (seconds > 0 ? seconds + " second" + (seconds > 1 ? "s" : "") : ""), true);
          embed.addField("Views", info.view_count, true);
          message.channel.sendEmbed(embed);
        });
      }
    },
    volume: {
      name: "volume",
      runtime: function(message, client, data) {
        var command = processCommand(message.content);
        if (command.params.length === 0) {
          message.channel.sendMessage("```" + me.prefix + "volume [dial | percent] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
          return;
        }

        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }

        var amount = 0;
        if (!isNaN(parseInt(processCommand(message.content).params[0])) || (processCommand(message.content).params[0] === "dial" && processCommand(message.content).params.length > 1)) {
          if (!isNaN(parseInt(processCommand(message.content).params[0]))) {
            amount = Math.round(parseInt(processCommand(message.content).params[0]));
          } else {
            amount = Math.round(parseInt(processCommand(message.content).params[1]));
          }

          if (isNaN(amount)) {
            message.channel.sendMessage("```" + me.prefix + "volume [dial | percent] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
            return;
          }

          if (amount < 1 || amount > 10) {
            message.channel.sendMessage("That number isn't on my dial.");
            return;
          }

          if (data.bin.musicMuted === true) {
            message.channel.sendMessage("I'm muted, you need to unmute me first.");
            return;
          }

          data.bin.musicVolume = amount * 0.2;
          data.bin.voiceDispatcher.setVolume(amount * 0.2);
          message.channel.sendMessage("Set the dial to " + amount + ".");
        } else if (processCommand(message.content).params[0] === "percent" && processCommand(message.content).params.length > 1) {
          amount = Math.round(parseInt(processCommand(message.content).params[1]));
          if (isNaN(amount)) {
            message.channel.sendMessage("```" + me.prefix + "volume [dial | percent] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
            return;
          }

          if (amount < 1 || amount > 200) {
            message.channel.sendMessage("That number is too loud.");
            return;
          }

          if (data.bin.musicMuted === true) {
            message.channel.sendMessage("I'm muted, you need to unmute me first.");
            return;
          }

          data.bin.musicVolume = amount / 100;
          data.bin.voiceDispatcher.setVolume(amount / 100);
          message.channel.sendMessage("Set the gain to " + amount + "%.");
        } else {
          message.channel.sendMessage("```" + me.prefix + "volume [dial | percent] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
        }
      }
    },
    mute: {
      name: "mute",
      runtime: function(message, client, data) {
        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }

        if (data.bin.musicMuted === true) {
          message.channel.sendMessage("The music is already muted.");
          return;
        }

        data.bin.musicMuted = true;
        data.bin.voiceDispatcher.setVolume(0);
        message.channel.sendMessage("Muted the music.");
      }
    },
    unmute: {
      name: "unmute",
      runtime: function(message, client, data) {
        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }

        if (data.bin.musicMuted === false) {
          message.channel.sendMessage("The music is not muted.");
          return;
        }

        data.bin.musicMuted = false;
        data.bin.voiceDispatcher.setVolume(data.bin.musicVolume);
        message.channel.sendMessage("Unmuted the music.");
      }
    },
    pause: {
      name: "pause",
      runtime: function(message, client, data) {
        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }

        if (data.bin.musicState === 2) {
          message.channel.sendMessage("The music is already paused.");
          return;
        }

        data.bin.voiceDispatcher.pause();
        data.bin.musicState = 2;
        message.channel.sendMessage("Music paused.");
      }
    },
    stop: {
      name: "stop",
      runtime: function(message, client, data) {
        if (data.bin.musicState === 0) {
          message.channel.sendMessage("There's no music playing.");
          return;
        }
        data.bin.playingMusic = null;
        data.bin.voiceDispatcher.end();
        data.bin.voiceDispatcher = undefined;
        data.bin.musicState = 0;
        message.channel.sendMessage("Music stopped.");
      }
    },
    leave: {
      name: "leave",
      runtime: function(message, client, data) {
        if (typeof data.bin.voiceChannel === "undefined") {
          message.channel.sendMessage("I'm not in a voice channel.");
          return;
        }
        data.bin.playingMusic = null;
        data.bin.voiceDispatcher.end();
        data.bin.voiceDispatcher = undefined;
        data.bin.voiceChannel.disconnect();
        data.bin.voiceChannel = undefined;
        data.bin.musicState = 0;
        message.channel.sendMessage("I left the voice channel.");
      }
    }
  };

  var client = new lib_discord.Client();

  client.on("ready", function() {
    console.log("Server ready!");

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

    var command = message.content.substring(me.prefix.length).split(me.seperator)[0];
    var params = message.content.split(me.seperator).slice(1);

    for (var key in me.commands) {
      if (me.commands[key].name === command && typeof me.commands[key].runtime === "function") {
        me.commands[command].runtime(message, client, me.guild[message.channel.guild.id]);
      }
    }

  });

  client.login(me.token); // Bot token. No stealies

}

var bot = new botInit();

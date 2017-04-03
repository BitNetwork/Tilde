{
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
      const lib_ytdl = require("ytdl-core");

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
      const lib_ytdl = require("ytdl-core");

      if (data.bin.musicState === 0) {
        message.channel.sendMessage("There's no music playing.");
        return;
      }

      lib_ytdl.getInfo(data.bin.playingMusic, function(error, info) {
        if (error) {
          message.channel.sendMessage("Error getting details.");
          return;
        }

        /* Download url contains host's ip address... euhh
        if (processCommand(message.content).params[0] === "grab") {
          message.channel.sendMessage(info.formats[0].url);
          return;
        }*/

        var embed = new lib_discord.RichEmbed();
        embed.setColor("#ff0000"); // Red... like YouTube ;)
        embed.setTitle(info.title);
        embed.setAuthor(info.author.name);
        embed.setImage(info.iurl);
        embed.setURL(data.bin.playingMusic);
        if (info.description.length > 250) {
          embed.setDescription("*" + info.description.substring(0, 497) + "...*");
        } else {
          embed.setDescription("*" + info.description.substring(0, 500) + "*");
        }
        var published = new Date(info.published);
        embed.setTimestamp(published);
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
      function help() {
        message.channel.sendMessage("```" + me.prefix + "volume [dial | gain] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
      }

      var command = processCommand(message.content);
      if (command.params.length < 1) {
        help();
        return;
      }

      if (data.bin.musicState === 0) {
        message.channel.sendMessage("There's no music playing.");
        return;
      }

      var amount = 0;
      if (command.params[0].match(/^\d+$/) !== null) {
        amount = Math.round(parseInt(command.params[0]));

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
      } else if (command.params[0] === "dial" && command.params.length > 1 && command.params[1].match(/^\d+$/) !== null) {
        amount = Math.round(parseInt(command.params[1]));

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
      } else if (command.params[0] === "gain" && command.params.length > 1 && command.params[1].match(/^\d+$/) !== null) {
        amount = Math.round(parseInt(command.params[1]));

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
        help();
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
      if (data.bin.voiceChannel === null) {
        message.channel.sendMessage("I'm not in a voice channel.");
        return;
      }
      data.bin.playingMusic = null;
      data.bin.voiceDispatcher = null;
      data.bin.voiceChannel.disconnect();
      data.bin.voiceChannel = null;
      data.bin.musicState = 0;
      message.channel.sendMessage("I left the voice channel.");
    }
  }
}

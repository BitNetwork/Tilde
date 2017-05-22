module.exports = function(modification, bot) {
  const ytdl = require("ytdl-core");
  const discordjs = require("discord.js");

  modification.onready = function(guild, modification) {
    guild.bin.voiceChannel = null;
    guild.bin.voiceDispatcher = null;
    guild.bin.musicState = 0; // 0 = stopped, 1 = playing, 2 = paused
    guild.bin.musicVolume = 1;
    guild.bin.musicMuted = false;
    guild.bin.playingMusic = null;
  };

  modification.registerCommand("join", function(guild, command, message) {
    if (typeof message.member.voiceChannel === "undefined") {
      message.channel.send("You don't appear to be in a voice channel.");
      return;
    }

    message.member.voiceChannel.join().then(function(connection) {
      guild.bin.voiceChannel = connection;
    });
  });

  modification.registerCommand("play", function(guild, command, message) {
    if (guild.bin.musicState === 2) {
      guild.bin.voiceDispatcher.resume();
      guild.bin.musicState = 1;
      message.channel.send("Music resumed.");
      return;
    }

    if (guild.bin.musicState !== 0) {
      message.channel.send("There's already something playing.");
      return;
    }

    if (command.params.length === 0) {
      message.channel.send("```" + command.prefix + "play [yt video]\n\nPlays a song in your connected voice channel.```");
      return;
    }

    if (typeof message.member.voiceChannel === "undefined") {
      message.channel.send("You don't appear to be in a voice channel.");
      return;
    }

    message.member.voiceChannel.join().then(function(connection) {
      // Get info with http://stackoverflow.com/q/38810536/3434588
      guild.bin.voiceChannel = connection;

      let url = "";
      let youtubeUrlRegex = /^(?:http(?:s)?:\/\/)?(?:www\.)?(?:(?:youtube.com(?:(?::80)|(?::443))?\/watch\?v=)|(?:youtu.be(?:(?::80)|(?::443))?\/))([\w\d_-]{8,13})/;
      if (command.params.length > 0 && command.params[0].match(youtubeUrlRegex) !== null && command.params[0].match(youtubeUrlRegex).length > 1) {
        url = "https://www.youtube.com/watch?v=" + command.params[0].match(youtubeUrlRegex)[1];
      } else {
        message.channel.send("Music not found.");
        return;
      }

      guild.bin.playingMusic = url;
      ytdl.getInfo(url, function(error, info) {
        if (error) {
          message.channel.send("Music not found.");
          return;
        }

        let stream = ytdl(url, {filter: "audioonly"});
        message.channel.send("Playing music...");

        setTimeout(function(stream) {
          guild.bin.voiceDispatcher = connection.playStream(stream, {volume: guild.bin.musicVolume});
          guild.bin.voiceDispatcher.on("start", function() {
            guild.bin.musicState = 1;
          });
          guild.bin.voiceDispatcher.on("end", function() {
            guild.bin.musicState = 0;
            guild.bin.playingMusic = null;
            guild.bin.voiceDispatcher = undefined;
          });
        }, 2500, stream);
      });
    });
  });

  modification.registerCommand("pause", function(guild, command, message) {
    if (guild.bin.musicState === 0) {
      message.channel.send("There's no music playing.");
      return;
    }

    if (guild.bin.musicState === 2) {
      message.channel.send("The music is already paused.");
      return;
    }

    guild.bin.voiceDispatcher.pause();
    guild.bin.musicState = 2;
    message.channel.send("Music paused.");
  });

  modification.registerCommand("stop", function(guild, command, message) {
    if (guild.bin.musicState === 0) {
      message.channel.send("There's no music playing.");
      return;
    }
    guild.bin.playingMusic = null;
    guild.bin.voiceDispatcher.end();
    guild.bin.voiceDispatcher = undefined;
    guild.bin.musicState = 0;
    message.channel.send("Music stopped.");
  });

  modification.registerCommand("leave", function(guild, command, message) {
    if (guild.bin.voiceChannel === null) {
      message.channel.send("I'm not in a voice channel.");
      return;
    }
    guild.bin.playingMusic = null;
    guild.bin.voiceDispatcher = null;
    guild.bin.voiceChannel.disconnect();
    guild.bin.voiceChannel = null;
    guild.bin.musicState = 0;
    message.channel.send("I left the voice channel.");
  });

  modification.registerCommand("volume", function(guild, command, message) {
    function help() {
      message.channel.send("```" + command.prefix + "volume [dial | gain] [1-10 | 0-200]\n\nAdjusts the volume of the current music.```");
    }

    if (command.params.length < 1) {
      help();
      return;
    }

    if (guild.bin.musicState === 0) {
      message.channel.send("There's no music playing.");
      return;
    }

    let amount = 0;
    if (command.params[0].match(/^\d+$/) !== null) {
      amount = Math.round(parseInt(command.params[0]));

      if (amount < 1 || amount > 10) {
        message.channel.send("That number isn't on my dial.");
        return;
      }

      if (guild.bin.musicMuted === true) {
        message.channel.send("I'm muted, you need to unmute me first.");
        return;
      }

      guild.bin.musicVolume = amount * 0.2;
      guild.bin.voiceDispatcher.setVolume(amount * 0.2);
      message.channel.send("Set the dial to " + amount + ".");
    } else if (command.params[0] === "dial" && command.params.length > 1 && command.params[1].match(/^\d+$/) !== null) {
      amount = Math.round(parseInt(command.params[1]));

      if (amount < 1 || amount > 10) {
        message.channel.send("That number isn't on my dial.");
        return;
      }

      if (guild.bin.musicMuted === true) {
        message.channel.send("I'm muted, you need to unmute me first.");
        return;
      }

      guild.bin.musicVolume = amount * 0.2;
      guild.bin.voiceDispatcher.setVolume(amount * 0.2);
      message.channel.send("Set the dial to " + amount + ".");
    } else if (command.params[0] === "gain" && command.params.length > 1 && command.params[1].match(/^\d+$/) !== null) {
      amount = Math.round(parseInt(command.params[1]));

      if (amount < 1 || amount > 200) {
        message.channel.send("That number is too loud.");
        return;
      }

      if (guild.bin.musicMuted === true) {
        message.channel.send("I'm muted, you need to unmute me first.");
        return;
      }

      guild.bin.musicVolume = amount / 100;
      guild.bin.voiceDispatcher.setVolume(amount / 100);
      message.channel.send("Set the gain to " + amount + "%.");
    } else {
      help();
    }
  });

  modification.registerCommand("song", function(guild, command, message) {
    if (guild.bin.musicState === 0) {
      message.channel.send("There's no music playing.");
      return;
    }

    ytdl.getInfo(guild.bin.playingMusic, function(error, info) {
      if (error) {
        message.channel.send("Error getting details.");
        return;
      }

      /* Download url contains host's ip address... euhh
      if (command.params[0] === "grab") {
        message.channel.send(info.formats[0].url);
        return;
      }*/

      let embed = new discordjs.RichEmbed();
      embed.setColor("#ff0000"); // Red... like YouTube ;)
      embed.setTitle(info.title);
      embed.setAuthor(info.author.name);
      embed.setImage(info.iurl);
      embed.setURL(guild.bin.playingMusic);
      if (info.description.length > 250) {
        embed.setDescription("*" + info.description.substring(0, 497) + "...*");
      } else {
        embed.setDescription("*" + info.description.substring(0, 500) + "*");
      }
      let published = new Date(info.published);
      embed.setTimestamp(published);
      let seconds = 0;
      let minutes = 0;
      let hours = 0;
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
  });

};

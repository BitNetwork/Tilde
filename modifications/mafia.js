module.exports = function(modification, bot) {
  modification.on("ready", function(guild) {
    guild.bin.mafiaStatus = 0; // 0: not playing, 1: waiting for players, 2: playing
    guild.bin.mafiaHost = "";
    guild.bin.mafiaMembers = [];
    guild.bin.mafiaIsDay = false;
    guild.bin.mafiaCycle = 0;
  });

  function mafiaCycle(member, guild, message) {
    if (guild.bin.mafiaIsDay) { // Day switching to night
      guild.bin.mafiaIsDay = false;
      guild.bin.mafiaCycle++;
    } else { // Night switching to day
      guild.bin.mafiaIsDay = true;
    }
    message.channel.send("");
  }

  modification.registerCommand("mafia", function(member, command, message) {
    let guild = member.guild;

    switch (command.params[0]) {
      case "play":
        if (guild.bin.mafiaStatus === 2) {
          message.channel.send("A game is already in play.");
          return;
        } else if (guild.bin.mafiaStatus === 0) {
          guild.bin.mafiaHost = message.author.id;
          guild.bin.mafiaChannel = message.channel.id;
          guild.bin.mafiaStatus = 1;
          message.channel.send("A game of mafia is being started!");
        } else if (guild.bin.mafiaMembers.filter(function(mafiaMember) { return mafiaMember === message.author.id; }).length > 0) {
          return;
        }

        guild.bin.mafiaMembers.push(message.author.id);
        message.react("\u2714"); // :heavy_check_mark:
        break;
      case "start":
        if (guild.bin.mafiaStatus === 2) {
          message.channel.send("A game is already in play.");
          return;
        } else if (guild.bin.mafiaHost !== message.author.id) {
          message.channel.send("You aren't the game host.");
          return;
        }

        guild.bin.mafiaStatus = 2;
        message.channel.send("The game is starting!");

        mafiaCycle(member, guild);
        break;
    }
  });
};
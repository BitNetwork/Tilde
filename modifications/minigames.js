module.exports = function(modification, bot) {
  modification.on("ready", function(guild) {
    guild.bin.chipStatus = 0; // 0: not playing, 1: waiting for players, 2: playing
    guild.bin.chipBoard = 0;
    guild.bin.chipMembers = [];
    guild.bin.chipHost = "";
    guild.bin.chipTurn = 0;
  });

  modification.registerCommand("chip", function(member, command, message) {
    let guild = member.guild;

    switch (command.params[0]) {
      case "play":
        if (guild.bin.chipStatus === 2) {
          message.channel.send("A game is already in play.");
          return;
        } else if (guild.bin.chipStatus === 0) {
          guild.bin.chipHost = message.author.id;
          guild.bin.chipStatus = 1;
          guild.bin.chipMembers = [];
          message.channel.send("A game is being started!");
        } else if (guild.bin.chipMembers.filter(function(chipMember) { return chipMember === message.author.id; }).length > 0) {
          return;
        }

        guild.bin.chipMembers.push(message.author.id);
        message.react("\u2714"); // :heavy_check_mark:
        break;
      case "start":
        if (guild.bin.chipStatus === 0) {
          message.channel.send("A game isn't in play.");
          return;
        } else if (guild.bin.chipStatus === 2) {
          message.channel.send("A game is already in play.");
          return;
        } else if (guild.bin.chipHost !== message.author.id) {
          message.channel.send("You aren't the game host.");
          return;
        } else if (guild.bin.chipMembers.length < 2) {
          message.channel.send("There isn't enough players.");
          return;
        }

        guild.bin.chipStatus = 2;
        guild.bin.chipTurn = 0;
        guild.bin.chipBoard = 10 + (guild.bin.chipMembers.length * 2);
        message.channel.send("The game is starting!");

        message.channel.send("\u26AA".repeat(guild.bin.chipBoard) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard) + " <@" + guild.bin.chipMembers[guild.bin.chipTurn] + ">");
        break;

      case "board":
        if (guild.bin.chipStatus !== 2) {
          message.channel.send("A game isn't in play.");
          return;
        }

        message.channel.send("\u26AA".repeat(guild.bin.chipBoard) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard));
        break;

      case "take":
        if (guild.bin.chipStatus !== 2) {
          message.channel.send("A game isn't in play.");
          return;
        } else if (guild.bin.chipMembers[guild.bin.chipTurn] !== message.author.id) {
          message.channel.send("It isn't your turn.");
          return;
        } else if (command.params.length < 1 || !(command.params[1] === "1" || command.params[1] === "2" || command.params[1] === "3")) {
          message.channel.send("help text here");
          return;
        }

        guild.bin.chipBoard -= parseInt(command.params[1], 10);

        if (guild.bin.chipBoard < 1) {
          guild.bin.chipStatus = 0;
          message.channel.send("\uD83D\uDD34".repeat(guild.bin.chipBoard + parseInt(command.params[1], 10)) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard - parseInt(command.params[1], 10)) + " <@" + guild.bin.chipMembers[guild.bin.chipTurn] + "> has won the game!");
          return;
        } else if (guild.bin.chipTurn === guild.bin.chipMembers.length - 1) {
          guild.bin.chipTurn = 0;
        } else {
          guild.bin.chipTurn++;
        }

        message.channel.send("\u26AA".repeat(guild.bin.chipBoard) + "\uD83D\uDD34".repeat(parseInt(command.params[1], 10)) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard - parseInt(command.params[1], 10)) + " <@" + guild.bin.chipMembers[guild.bin.chipTurn] + ">");
        break;
    }
  });
};
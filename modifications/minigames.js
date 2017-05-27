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
    function help() {
      message.channel.send(`\`\`\`${guild.data.prefix}chip [-h --help] [-j --join] [-s --start] [-b --board] [-t --take (number 1-3)]\nControls a game of chip.\n-h --help | shows this help text\n-j --join | creates or joins a game\n-s --start | starts the game, must be done by game host\n-b --board | displays the board\n-t --take number | takes a number of chips from the board\`\`\``);
    }

    if (command.switches["h"] !== undefined || command.switches["help"] !== undefined) {
      help();
    } else if (command.switches["j"] !== undefined || command.switches["join"] !== undefined) {
      if (guild.bin.chipStatus === 2) {
        message.channel.send("A game is already in play.");
        return;
      } else if (guild.bin.chipStatus === 0) {
        guild.bin.chipHost = message.author.id;
        guild.bin.chipStatus = 1;
        guild.bin.chipMembers = [];
        message.channel.send("A game is being started!");
      } else if (guild.bin.chipMembers.filter(function(chipMember) { return chipMember === message.author.id; }).length > 0) {
        message.channel.send("You've already joined.");
        return;
      }

      guild.bin.chipMembers.push(message.author.id);
      message.react("\u2714"); // :heavy_check_mark:
    } else if (command.switches["s"] !== undefined || command.switches["start"] !== undefined) {
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
    } else if (command.switches["b"] !== undefined || command.switches["board"] !== undefined) {
      if (guild.bin.chipStatus !== 2) {
        message.channel.send("A game isn't in play.");
        return;
      }

      message.channel.send("\u26AA".repeat(guild.bin.chipBoard) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard));
    } else if (command.switches["t"] !== undefined || command.switches["take"] !== undefined) {
      let number = command.switches["t"] || command.switches["take"];

      if (guild.bin.chipStatus !== 2) {
        message.channel.send("A game isn't in play.");
        return;
      } else if (guild.bin.chipMembers[guild.bin.chipTurn] !== message.author.id) {
        message.channel.send("It isn't your turn.");
        return;
      } else if (number === "" || !(number === "1" || number === "2" || number === "3")) {
        help();
        return;
      }

      guild.bin.chipBoard -= parseInt(number, 10);

      if (guild.bin.chipBoard < 1) {
        guild.bin.chipStatus = 0;
        message.channel.send("\uD83D\uDD34".repeat(guild.bin.chipBoard + parseInt(number, 10)) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard - parseInt(number, 10)) + " <@" + guild.bin.chipMembers[guild.bin.chipTurn] + "> has won the game!");
        return;
      } else if (guild.bin.chipTurn === guild.bin.chipMembers.length - 1) {
        guild.bin.chipTurn = 0;
      } else {
        guild.bin.chipTurn++;
      }

      message.channel.send("\u26AA".repeat(guild.bin.chipBoard) + "\uD83D\uDD34".repeat(parseInt(number, 10)) + "\u26AB".repeat((10 + (guild.bin.chipMembers.length * 2)) - guild.bin.chipBoard - parseInt(number, 10)) + " <@" + guild.bin.chipMembers[guild.bin.chipTurn] + ">");
    } else {
      help();
    }
  });
};
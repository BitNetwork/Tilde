{
  captcha: {
    name: "captcha",
    startup: function(client, data) {
      data.bin.captcha = null;
      data.bin.captchaDifficulty = 3;
    },
    runtime: function(message, client, data) {
      const lib_captcha = require("captcha.js");

      var command = processCommand(message.content);
      var failed = false;

      if (command.params.length > 0 && data.bin.captcha !== null) {
        // Solve captcha
        if (command.params[0] === data.bin.captcha) {
          message.channel.sendMessage(makeMention(message.author.id) + " Captcha solved!");
          data.bin.captcha = null;
          return;
        } else {
          failed = true;
        }
      }

      if (command.params > 0 && failed === false && command.params[0].match(/^\d+$/) !== null) {
        var amount = Math.round(parseInt(command.params[0]));
        if (amount > 5) {
          message.channel.sendMessage("That number is too big.");
          return;
        } else if (amount < 1) {
          message.channel.sendMessage("That number is too small.");
          return;
        }
        data.bin.captchaDifficulty = amount;
      }

      var captcha = new lib_captcha({
        length: 8, // number of characters generated
        font_size: 75, // font size
        implode: data.bin.captchaDifficulty / 10, // text distortion
        colorful: true, // whether to colorful
        line: true, // whether to add dry winding
        cache_limit: 50, // number of caches
        cache_dir: "/tmp/" // cache folder
      });

      captcha.create(function(error, result) {
        if (error) {
          message.channel.sendMessage("Captcha could not be generated.");
        }

        message.channel.sendFile(result.filePath, "captcha.png", (failed ? makeMention(message.author.id) + " Try again." : "Please solve this captcha " + makeMention(message.author.id) + "\nIt is case-sensitive.\nRespond with " + me.prefix + "captcha [answer]"));
        data.bin.captcha = result.code;

      });
    },
    dmruntime: function(message, channel, data) {
      const lib_captcha = require("captcha.js");

      var command = processCommand(message.content);
      var failed = false;

      if (command.params.length > 0 && data.bin.captcha !== null) {
        // Solve captcha
        if (command.params[0] === data.bin.captcha) {
          message.channel.sendMessage(makeMention(message.author.id) + " Captcha solved!");
          data.bin.captcha = null;
          return;
        } else {
          failed = true;
        }
      }

      if (command.params > 0 && failed === false && command.params[0].match(/^\d+$/) !== null) {
        var amount = Math.round(parseInt(command.params[0]));
        if (amount > 5) {
          message.channel.sendMessage("That number is too big.");
          return;
        } else if (amount < 1) {
          message.channel.sendMessage("That number is too small.");
          return;
        }
        data.bin.captchaDifficulty = amount;
      }

      var captcha = new lib_captcha({
        length: 8, // number of characters generated
        font_size: 75, // font size
        implode: data.bin.captchaDifficulty / 10, // text distortion
        colorful: true, // whether to colorful
        line: true, // whether to add dry winding
        cache_limit: 50, // number of caches
        cache_dir: "/tmp/" // cache folder
      });

      captcha.create(function(error, result) {
        if (error) {
          message.channel.sendMessage("Captcha could not be generated.");
          return;
        }

        message.channel.sendFile(result.filePath, "captcha.png", (failed ? makeMention(message.author.id) + " Try again." : "Please solve this captcha " + makeMention(message.author.id) + "\nIt is case-sensitive.\nRespond with " + me.prefix + "captcha [answer]"));
        data.bin.captcha = result.code;

      });
    }
  }
}

{
  heist: {
    name: "heist",
    startup: function(client, data) {
      data.bin.heistCrew = [];
      data.bin.heistState = 0; // 0: not running, 1: waiting for crew, 2: playing
      data.data.heistBanks = [{name: "Some Guy's Wallet", size: 2, money: 350, difficulty: 0.6}, {name: "ATM Machine", size: 5, money: 1000, difficulty: 0.4}];
      data.data.heistActions = [{text: "$name accidently tripped the alarm.", result: 2}, {text: "$name was shot by local security... but survived.", result: 3}, {text: "$name cut through that safe like butter.", result: 0}, {text: "$name slept in and completely forgot about the heist.", result: 1}, {text: "In the process of setting up the explosive, $name was explosively killed.", result: 4}]; // 0: win, 1: alive, 2: caught, 3: injured, 4: dead
      data.data.heistConfig = {jailTimer: 5 * 1000 * 60, deathTimer: 20 * 1000 * 60};
    },
    runtime: function(message, client, data) {
      function help() {
        message.channel.sendMessage("```" + me.prefix + "heist [join|stats|banks|play|release|revive|heal|bailout]```");
      }
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        help();
        return;
      }

      if (command.params[0] === "join") {
        if (typeof data.data.user[message.author.id] !== "undefined" && typeof data.data.user[message.author.id].heistStatus !== "undefined") {
          message.channel.sendMessage("You are already part of the crew.");
          return;
        }

        if (typeof data.data.user[message.author.id] === "undefined") {
          createUserData(message.guild.id, message.author.id);
        }

        data.data.user[message.author.id].id = message.author.id;
        data.data.user[message.author.id].money = data.data.user[message.author.id].money ? data.data.user[message.author.id].money : 0;
        data.data.user[message.author.id].heistStatus = 1;
        data.data.user[message.author.id].heistTimer = 0;
        message.channel.sendMessage("Welcome to the crew, " + (message.member.nickname !==null ? message.member.nickname : message.author.username) + ".");
      } else if (command.params[0] === "stats") {
        if (typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.user[message.author.id];
        var embed = new lib_discord.RichEmbed();

        embed.setAuthor(grabServerName(message.member));
        var status = "";
        var color = "";
        if (heister.heistStatus === 1) {
          status = "Alive";
          color = "#00ff00"
        } else if (heister.heistStatus === 2) {
          status = "Apprehended";
          color = "#0000ff";
        } else if (heister.heistStatus === 3) {
          status = "Injured";
          color = "#ff0000"
        } else if (heister.heistStatus === 4) {
          status = "Dead";
          color = "#000000"
        }
        embed.setTitle(status);
        embed.setColor(color);
        // console.log(message.author.avatarURL)
        if (message.author.avatarURL !== null) {
          embed.setThumbnail(message.author.avatarURL);
        }
        embed.addField("Timer", heister.heistTimer, true);
        message.channel.sendEmbed(embed);

      } else if (command.params[0] === "play") {
        if (typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.user[message.author.id];
        if (heister.heistStatus === 2) {
          message.channel.sendMessage("You are apprehended currently.");
          return;
        }

        if (heister.heistStatus === 4) {
          message.channel.sendMessage("You are dead currently.");
          return;
        }

        if (data.bin.heistState === 0) {
          data.bin.heistState = 1;
          data.bin.heistCrew = [message.member];
          message.react("\u2714"); // :heavy_check_mark:
          message.channel.sendMessage("A heist is starting by " + grabServerName(message.member) + ".");
          setTimeout(function() {

            data.bin.heistState = 2;
            var bank = null;
            for (var i = 0; i < data.data.heistBanks.length; i++) {
              if (data.data.heistBanks[i].size >= data.bin.heistCrew.length) {
                bank = data.data.heistBanks[i];
                break;
              }
            }
            message.channel.sendMessage("The crew decided to raid " + bank.name + ".");

            for (var i = 0; i < data.bin.heistCrew.length; i++) {
              var user = data.data.user[data.bin.heistCrew[i].id];
              setTimeout(function(i) {
                var action = null;
                var ran = Math.random()
                console.log(ran)
                if (ran <= bank.difficulty) {
                  do {
                    action = data.data.heistActions[Math.floor(Math.random() * data.data.heistActions.length)];
                  } while (action.result !== 0)
                } else {
                  do {
                    action = data.data.heistActions[Math.floor(Math.random() * data.data.heistActions.length)];
                  } while (action.result === 0)
                }

                var won = false;
                if (user.heistStatus === 3 && action.result === 0) { // If the user won the heist while injured, make sure to record it and keep them injured
                  won = true;
                  user.heistStatus = 3;
                } else if (action.result === 0) { // If they won, make sure to set them to alive
                  won = true;
                  user.heistStatus = 1;
                } else if (user.heistStatus === 3 && action.result === 3) { // If injured, kill the user
                  user.heistStatus = 4;
                } else if (user.heistStatus === 3 && action.result !== 4 && action.result !== 2) { // If injured, make sure the injury persists no matter the outcome
                  user.heistStatus = 3;
                } else {
                  user.heistStatus = action.result;
                }

                if (user.heistStatus === 4) {
                  user.heistTimer = Date.now() + data.data.heistConfig.deathTimer;
                } else if (user.heistStatus === 2) {
                  user.heistTimer = Date.now() + data.data.heistConfig.jailTimer;
                }

                message.channel.sendMessage("`" + action.text.replace("$name", grabServerName(data.bin.heistCrew[i])) + "`").then(function(message) {
                  var emote = "";
                  if (won) {
                    message.react("\uD83D\uDCB0");
                  }

                  /*if (user.heistStatus === 1) {
                    //emote = "\uD83D\uDCA4"; // I might remove this. EDIT: #removedaf360noscopeheadshotcriticalhitlongdistance
                  } else*/
                  if (user.heistStatus !== 1) {
                    if (user.heistStatus === 2) {
                      emote = "\uD83D\uDE94";
                    } else if (user.heistStatus === 3) {
                      emote = "\uD83D\uDC89";
                    } else if (user.heistStatus === 4) {
                      emote = "\u2620";
                    }
                    message.react(emote);
                  }
                });
              }, i * 2500 + 2500, i);
            }

            setTimeout(function() {
              message.channel.sendMessage("The heist has ended.");
              data.bin.heistState = 0;
            }, data.bin.heistCrew.length * 2500 + 5000);

          }, 10 * 1000);
        } else if (data.bin.heistState === 1) {
          for (var i = 0; i < data.bin.heistCrew.length; i++) {
            if (data.bin.heistCrew[i].id === message.author.id) {
              return;
            }
          }

          data.bin.heistCrew.push(message.member);
          message.react("\u2714"); // :heavy_check_mark:
        } else if (data.bin.heistState === 2) {
          message.channel.sendMessage("The crew is already heisting. Wait for them to finish first.");
        }

      } else if (command.params[0] === "release") {
        if (typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }
        var heister = data.data.user[message.author.id];

        if (heister.heistStatus !== 2) {
          message.channel.sendMessage("You're not in jail.");
        } else if (heister.heistTimer <= Date.now()) {
          heister.heistStatus = 1;
          message.channel.sendMessage("You've been released!");
        } else {
          var remaining = new Date(heister.heistTimer - Date.now());
          var output = "";

          if (remaining.getHours() !== 0) {
            output += remaining.getHours() + " hour" + (remaining.getHours() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getMinutes() !== 0) {
            output += remaining.getMinutes() + " minute" + (remaining.getMinutes() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getSeconds() !== 0) {
            output += remaining.getSeconds() + " second" + (remaining.getSeconds() !== 1 ? "s" : "");
          }

          message.channel.sendMessage("You've still have " + output + " left on your sentence.");
        }
      } else if (command.params[0] === "revive") {
        if (typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }
        var heister = data.data.user[message.author.id];

        if (heister.heistStatus !== 4) {
          message.channel.sendMessage("You're not dead.");
        } else if (heister.heistTimer <= Date.now()) {
          heister.heistStatus = 1;
          message.channel.sendMessage("You've been revived!");
        } else {
          var remaining = new Date(heister.heistTimer - Date.now());
          var output = "";

          if (remaining.getHours() !== 0) {
            output += remaining.getHours() + " hour" + (remaining.getHours() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getMinutes() !== 0) {
            output += remaining.getMinutes() + " minute" + (remaining.getMinutes() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getSeconds() !== 0) {
            output += remaining.getSeconds() + " second" + (remaining.getSeconds() !== 1 ? "s" : "");
          }

          message.channel.sendMessage("You've still have " + output + " left until you can revive.");
        }
      } else if (command.params[0] === "heal") {

      } else if (command.params[0] === "bailout") {

      } else {
        help();
      }
    }
  }
}

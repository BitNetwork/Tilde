{
  heist: {
    name: "heist",
    startup: function(client, data) {
      data.bin.heistCrew = [];
      data.bin.heistLooters = [];
      data.bin.heistJoinMessage = null;
      data.bin.heistState = 0; // 0: not running, 1: waiting for crew, 2: playing

      data.data.heistBanks = [{name: "Some Guy's Wallet", size: 2, money: 350, difficulty: 0.6}, {name: "ATM Machine", size: 5, money: 1000, difficulty: 0.4}];
      data.data.heistActions = [{text: "$name accidently tripped the alarm.", result: 2}, {text: "$name was shot by local security... but survived.", result: 3}, {text: "$name cut through that safe like butter.", result: 0}, {text: "$name slept in and completely forgot about the heist.", result: 1}, {text: "In the process of setting up the explosive, $name was explosively killed.", result: 4}]; // 0: win, 1: alive, 2: caught, 3: injured, 4: dead
      data.data.heistConfig = {joinTimer: 20 * 1000, jailTimer: 5 * 1000 * 60, deathTimer: 20 * 1000 * 60, healCost: 500, bailBaseCost: 500, bailGrowth: 1.05};
    },
    runtime: function(message, client, data) {
      function help() {
        message.channel.sendMessage("```" + me.prefix + "heist [join|stats|banks|play|release|revive|heal|bailout]\n\nHeist is a game about teaming up with other crew members to steal credits from banks.\n\n!heist join\nJoins the heist crew and creates your heist profile.\n\n!heist stats [user]\nShows user's statistics and status. The color determines your status: green: alive, blue: apprehended, red: injured, black/gray: dead.\n\n!heist banks\nDisplays a list of banks.\n\n!heist play\nBegins or joins a game of heist. A checkmark reaction means you're in the crew. You can't join if you're apprehended or dead.\n\n!heist release\nReleases you after you've finished your jail sentence.\n\n!heist revive\nResurrectes you from the dead after your death timer has finished.\n\n!heist heal\nHeals you for a price, removing any injuries.\n\n!heist bailout user\nBails user out of jail for a price. Has a chance of failing and the bailer getting caught.```");
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

        data.data.user[message.author.id].heistStatWon = [0, 0]; // [total, this lifetime]
        data.data.user[message.author.id].heistStatCaught = [0, 0];
        data.data.user[message.author.id].heistStatInjured = [0, 0];
        data.data.user[message.author.id].heistStatDead = [0];
        data.data.user[message.author.id].heistStatStolden = 0;

        data.data.user[message.author.id].heistBailCost = data.data.heistConfig.bailBaseCost;

        message.channel.sendMessage("Welcome to the crew, " + (message.member.nickname !== null ? message.member.nickname : message.author.username) + ".");
      } else if (command.params[0] === "stats") {
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.user[message.author.id];
        if (command.params.length > 1) {
          var member = parseMention(command.params[1], message.guild);
          if (member === null || typeof data.data.user[member.id] === "undefined" || typeof data.data.user[member.id].heistStatus === "undefined") {
            message.channel.sendMessage("They're not part of the crew yet.");
            return;
          }
          heister = data.data.user[member.id];
        } else {
          var member = message.member;
        }

        var embed = new lib_discord.RichEmbed();

        embed.setAuthor(grabServerName(member));
        var avatar = member.user.avatarURL;
        if (avatar !== null) {
          embed.setThumbnail(avatar);
        }

        var status = "";
        var color = "";
        if (heister.heistStatus === 1) {
          color = "#00ff00"
        } else if (heister.heistStatus === 2) {
          color = "#0000ff";
        } else if (heister.heistStatus === 3) {
          color = "#ff0000"
        } else if (heister.heistStatus === 4) {
          color = "#000000"
        }
        embed.setColor(color);

        if (heister.heistStatus === 2 || heister.heistStatus === 4) {
          var remaining = new Date(heister.heistTimer - Date.now());
          var output = "";

          if (remaining.getHours() !== 0) {
            output += remaining.getHours() + " hour" + (remaining.getHours() !== 1 ? "s" : "") + " ";
          }
          if (remaining.getMinutes() !== 0) {
            output += remaining.getMinutes() + " minute" + (remaining.getMinutes() !== 1 ? "s" : "") + " ";
          }
          if (remaining.getSeconds() !== 0) {
            output += remaining.getSeconds() + " second" + (remaining.getSeconds() !== 1 ? "s" : " ");
          }
          embed.addField("Timer", output.trim(), false);
        }

        if (heister.heistStatus === 2) {
          embed.addField("Bail cost", heister.heistBailCost, false);
        } else if (heister.heistStatus === 4) {
          embed.addField("Heal cost", data.data.heistConfig.healCost, false);
        }

        embed.addField("Looted", heister.heistStatWon[0] + " [" + heister.heistStatWon[1] + "]", true);
        embed.addField("Apprehensions", heister.heistStatCaught[0] + " [" + heister.heistStatCaught[1] + "]", true);
        embed.addField("Injuries", heister.heistStatInjured[0] + " [" + heister.heistStatInjured[1] + "]", true);
        embed.addField("Deaths", heister.heistStatDead[0], true);
        embed.addField("Credits Stolden", heister.heistStatStolden, true);

        message.channel.sendEmbed(embed);

      } else if (command.params[0] === "banks") {

        var embed = new lib_discord.RichEmbed();
        for (var i = 0; i < data.data.heistBanks.length; i++) {
          var bank = data.data.heistBanks[i];
          embed.addField(bank.name, bank.money + " - " + bank.size + " - " + (bank.difficulty * 100) + "%", false);
        }
        message.channel.sendEmbed(embed);

      } else if (command.params[0] === "play") {
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
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
          data.bin.heistLooters = [];
          message.react("\u2714"); // :heavy_check_mark:
          message.channel.sendMessage("A heist is starting by " + grabServerName(message.member) + ".").then(function(message) {
            data.bin.heistJoinMessage = message;
            message.react("\u2795"); // :heavy_plus_sign:
          });
          setTimeout(function() {

            data.bin.heistState = 2;
            data.bin.heistJoinMessage = null;
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
              setTimeout(function(user, i) {
                var action = null;
                if (Math.random() <= bank.difficulty) {
                  do {
                    action = data.data.heistActions[Math.floor(Math.random() * data.data.heistActions.length)];
                  } while (action.result !== 0)
                } else {
                  do {
                    action = data.data.heistActions[Math.floor(Math.random() * data.data.heistActions.length)];
                  } while (action.result === 0)
                }

                if (action.result === 0) {
                  user.heistStatWon[0]++;
                  user.heistStatWon[1]++;
                } else if (action.result === 2) {
                  user.heistStatCaught[0]++;
                  user.heistStatCaught[1]++;
                } else if ((action.result === 3 && user.heistStatus === 3) || action.result === 4) {
                  user.heistStatDead[0]++;
                  user.heistStatWon[1] = 0;
                  user.heistStatCaught[1] = 0;
                  user.heistStatInjured[1] = 0;
                  user.heistBailCost = data.data.heistConfig.bailBaseCost;
                } else if (action.result === 3) {
                  user.heistStatInjured[0]++;
                  user.heistStatInjured[1]++;
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
                } else if (user.heistStatus === 3 && action.result !== 4 && action.result !== 2) { // If injured, make sure the injury persists
                  user.heistStatus = 3;
                } else {
                  user.heistStatus = action.result;
                }

                if (won) {
                  data.bin.heistLooters.push(data.bin.heistCrew[i]);
                }

                if (user.heistStatus === 4) {
                  user.heistTimer = Date.now() + data.data.heistConfig.deathTimer;
                } else if (user.heistStatus === 2) {
                  user.heistTimer = Date.now() + data.data.heistConfig.jailTimer;
                }

                message.channel.sendMessage("`" + action.text.replace("$name", grabServerName(data.bin.heistCrew[i])) + "`").then(function(message) {
                  var emote = "";
                  if (won) {
                    message.react("\uD83D\uDCB0"); // :moneybag:
                  }

                  /*if (user.heistStatus === 1) {
                    //emote = "\uD83D\uDCA4"; // I might remove this. EDIT: #removedaf360noscopeheadshotcriticalhitlongdistance
                  } else*/
                  if (user.heistStatus !== 1) {
                    if (user.heistStatus === 2) {
                      emote = "\uD83D\uDE94"; // :oncoming_police_car:
                    } else if (user.heistStatus === 3) {
                      emote = "\uD83D\uDC89"; // :syringe:
                    } else if (user.heistStatus === 4) {
                      emote = "\u2620"; // :skull_crossbones:
                    }
                    message.react(emote);
                  }
                });
              }, i * 2500 + 2500, user, i);
            }

            setTimeout(function() {
              message.channel.sendMessage("The heist has ended.");
              data.bin.heistState = 0;
              setTimeout(function() {

                if (data.bin.heistLooters.length > 0) {
                  var creditPerLooter = Math.floor(bank.money / 2 / data.bin.heistLooters.length);
                  var embed = new lib_discord.RichEmbed();
                  embed.setTitle("Credits won");
                  embed.setColor("#FFDF00");

                  for (var i = 0; i < data.bin.heistLooters.length; i++) {
                    var looter = data.data.user[data.bin.heistLooters[i].id];
                    embed.addField(grabServerName(data.bin.heistLooters[i]), creditPerLooter);
                    looter.money += creditPerLooter;
                    looter.heistStatStolden += creditPerLooter;
                    bank.money -= creditPerLooter;
                  }
                  embed.setFooter("Credits left: " + bank.money);
                  message.channel.sendEmbed(embed);
                } else {
                  message.channel.sendMessage("No one made it out safe.");
                }

              }, 2500);
            }, data.bin.heistCrew.length * 2500 + 5000);

          }, data.data.heistConfig.joinTimer);
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
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
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
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
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
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }
        var heister = data.data.user[message.author.id];

        if (heister.heistStatus !== 3) {
          message.channel.sendMessage("You're not hurt.");
          return;
        } else if (heister.money < data.data.heistConfig.healCost) {
          message.channel.sendMessage("You don't have that sum in your account.");
          return;
        }

        heister.heistStatus = 1;
        heister.money -= data.data.heistConfig.healCost;
        message.channel.sendMessage("You've been healed of your injuries.");

      } else if (command.params[0] === "bailout") {
        if (typeof data.data.user[message.author.id] === "undefined" || typeof data.data.user[message.author.id].heistStatus === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }
        var heister = data.data.user[message.author.id];

        if (command.params.length < 2) {
          help();
          return;
        }
        var friend = parseMention(command.params[1]);
        var friendHeister = data.data.user[friend.id];

        if (friend === null || data.data.user[friend.id] === "undefined") {
          message.channel.sendMessage("Friend isn't part of the crew.");
          return;
        } else if (friend.id === message.author.id) {
          message.channel.sendMessage("You can't bail yourself out of jail.");
          return;
        } else if (friendHeister.heistStatus !== 2) {
          message.channel.sendMessage("Your friend is not apprehended.");
          return;
        } else if (heister.heistStatus === 2) {
          message.channel.sendMessage("You can't bail someone out if you're already in jail.");
        } else if (heister.money < friendHeister.heistBailCost) {
          message.channel.sendMessage("You don't have that sum in your account.");
          return;
        }

        heister.money -= friendHeister.heistBailCost;
        friendHeister.heistBailCost = Math.ceil(Math.pow(heister.heistBailCost, data.data.heistConfig.bailGrowth)); // Oh yeah, that's right... it's exponential
        friendHeister.heistStatus = 1;

      } else {
        help();
      }
    },
    reactionadd: function(reaction, client, data) {
      if (data.bin.heistJoinMessage === null || data.bin.heistJoinMessage.author.id === reaction[1].id) {
        return;
      }

      if (typeof data.data.user[reaction[1].id] === "undefined" || typeof data.data.user[reaction[1].id].heistStatus === "undefined") {
        reaction[0].message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
        return;
      }

      if (reaction[0].message.id === data.bin.heistJoinMessage.id && reaction[0].emoji.name === "\u2795") { // :heavy_plus_sign:
        for (var i = 0; i < data.bin.heistCrew.length; i++) {
          if (data.bin.heistCrew[i].id === reaction[1].id) {
            return;
          }
        }

        data.bin.heistCrew.push(reaction[0].message.guild.member(reaction[1]));
        data.bin.heistJoinMessage.react("\u2714"); // :heavy_check_mark:
      }
    }
  }
}

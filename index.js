const { Client, Intents } = require("discord.js");
const config = require("./config.json");
const fetch = require("isomorphic-unfetch");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

// https://discord.com/api/oauth2/authorize?client_id=895802049768353832&permissions=8&scope=bot%20messages.read

let data = [];
let offset = 0;

const parseScore = (text) => {
  var p = /<serverTime>([\d.]+)/im,
    pi = /<s t='([\d]+)'>([\d.]+)/gim,
    r;

  var nextData = [];
  var serverTime = p.exec(text)[1];

  do {
    if ((r = pi.exec(text))) {
      nextData[r[1]] = parseFloat(r[2]);
    }
  } while (r);

  const currentSecond = Math.floor(Date.now() / 1000.0);
  offset = currentSecond - serverTime;

  data = nextData;
};

const getDot = (score) => {
  if (score < 0.05) {
    return "🔴";
  } else if (score < 0.1) {
    return "🟠";
  } else if (score < 0.4) {
    return "🟡";
  } else if (score < 0.9) {
    return "🟢";
  } else if (score < 0.95) {
    return "🔵";
  } else if (score < 1) {
    return "🟣";
  } else {
    return "⚫";
  }
};

const setData = async () => {
  console.log("[FETCH]");
  const f = await fetch(
    `https://global-mind.org/gcpdot/gcpindex.php?current=1&nonce=${Math.round(
      Math.random() * 10000000
    )}`
  );
  parseScore(await f.text());
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag} !`);

  setData();
  setInterval(async () => {
    setData();
  }, [20000]);

  setInterval(async () => {
    const currentSecond = Math.floor(Date.now() / 1000.0) - offset;
    const score = data[currentSecond];
    console.log("[UPDATE] ", { currentSecond, score });
    if (score) {
      const r = client.user.setActivity({
        type: "WATCHING",
        name: `${getDot(score)}${score.toFixed(4)}`,
      });
    }
  }, [5000]);
});

client.login(config.id);

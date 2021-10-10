/**
 * https://discord.com/api/oauth2/authorize?client_id=895802049768353832&permissions=8&scope=bot%20messages.read
 */

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

// translates strange xml-shaped data into list of socres, the maximum second
// represented in those scores and the offset between "serverTime" and our
// clock
const parseScore = (text) => {
  var p = /<serverTime>([\d.]+)/im,
    pi = /<s t='([\d]+)'>([\d.]+)/gim,
    r;

  const scores = new Map();
  const serverTime = p.exec(text)[1];
  let maxSecond;

  do {
    if ((r = pi.exec(text))) {
      maxSecond = parseInt(r[1], 10);
      scores.set(parseInt([r[1]], 10), parseFloat(r[2]));
    }
  } while (r);

  const currentSecond = Math.floor(Date.now() / 1000.0);
  offset = currentSecond - serverTime;

  return { scores, maxSecond, offset };
};

const fetchData = async () => {
  const f = await fetch(
    `https://global-mind.org/gcpdot/gcpindex.php?current=1&nonce=${Math.round(
      Math.random() * 10000000
    )}`
  );
  return parseScore(await f.text());
};

// Score generator keeps track of state and determines whether or not we have
// the current score already fetched or if we need to fetch again.
function initScoreGenerator() {
  let maxSecond = 0;
  let offset = 0;
  let scores = new Map();

  const refetchData = async () => {
    console.log("[FETCH]");
    const gcpData = await fetchData();
    maxSecond = gcpData.maxSecond;
    offset = gcpData.offset;
    scores = gcpData.scores;
    console.log("[FETCH]", { maxSecond });
  };

  // checks if we have data (currentSecond >= maxSecond). If not, refetches
  // from server. Then, returns the score at the currentSecond;
  return async () => {
    currentSecond = Math.floor(Date.now() / 1000.0) - offset;
    console.info("[GET SCORE]", { currentSecond, maxSecond });
    if (currentSecond >= maxSecond) {
      await refetchData();
      currentSecond = Math.floor(Date.now() / 1000.0) - offset;
    }
    console.info("[GET SCORE]", { score: scores.get(currentSecond) });
    return scores.get(currentSecond);
  };
}

const scoreToDot = (score) => {
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag} !`);
  const scoreGen = initScoreGenerator();

  setInterval(async () => {
    const score = await scoreGen();
    const r = client.user.setActivity({
      type: "WATCHING",
      name: `${scoreToDot(score)}${score.toFixed(4)}`,
    });
  }, [5000]);
});

client.login(config.id);

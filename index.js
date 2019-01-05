// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

const Client = require('instagram-private-api').V1;
Client.config = require("./config.js");
Client.logger = require("./modules/Logger.js");
const device = new Client.Device(Client.config.username);
const storage = new Client.CookieFileStorage(__dirname + `/cookies/${Client.config.username}.json`);
let AccID = Client.config.AccID;

// Main async function
(async () => {
    const session = await Client.Session.create(device, storage, Client.config.username, Client.config.password);
    Client.logger.log(`Logged in at ${session.device.username}`, "ready");

    setInterval(async function() {

        // create new inbox feed with first 10 threads
        const feed = new Client.Feed.Inbox(session, 10);
        const allResults = await feed.all(); // .all resurns promise
        // find DM corresponding with the username found in config OR
        //  the id found in config
        if (AccID) {
            const thread = await allResults.find(x => x.params.accounts[0].username == Client.config.AccUsr || x.params.accounts[0].id == Client.config.AccID);
            /*
            const lsmcs = thread.params.items[0].timestamp.toNumber();
            const lsms = Math.floor(lsmcs / 1000);
            const obj = thread.params.itemsSeenAt;
            const ls = obj[Object.keys(obj)[0]].timestamp;
            console.log(ls - lsms);
            */ //if (ls - lsms != 0) return;

            //console.log(thread.items[0].params);
            if (thread.items[0].params.userId == Client.config.AccID) {
                let msg;
                if (["like", "text", "placeholder"].indexOf(thread.items[0].params.type) !== -1) {
                    if (thread.items[0].params.type == "like") {
                        msg = '❤️'
                    } else if (thread.items[0].params.type == "text") {
                        msg = thread.items[0].params.text;
                    } else if (thread.items[0].params.type == "placeholder") {
                        msg = thread.items[0].params.placeholder.message;
                    } else {
                        msg = 'huh?';
                    }
                    new Client.Thread.configureText(session, AccID, msg).then(function(t) {
                        Client.logger.log("Sent message!");
                    });
                } else {
                    if (thread.items[0].params.type == "mediaShare") {
                        let idd = thread.items[0].params.mediaShare.id;
                        new Client.Thread.configureMediaShare(session, AccID, idd).then(function(t) {
                            Client.logger.log("Sent post!");
                        });
                    } else if (thread.items[0].params.type == "media") {
                        new Client.Thread.configureText(session, AccID, "huh?").then(function(t) {
                            Client.logger.log("Sent message!");
                        });
                        /*
                        console.log(thread.items[0].params.itemId);
                        new Client.Thread.configurePhoto(session, AccID, thread.items[0].params.media.url).then(function(t) {
                            Client.logger.log("Sent photo!");
                        });
                        */
                    } else if (thread.items[0].params.type == "profile") {
                        new Client.Thread.configureProfile(session, AccID, thread.items[0].params.profile.id, "1").then(function(t) {
                            Client.logger.log("Send profile!");
                        });
                    } else if (thread.items[0].params.type == "hashtag") {
                        new Client.Thread.configureHashtag(session, AccID, thread.items[0].params.hashtag.name, "1").then(function(t) {
                            Client.logger.log("Send hashtag!");
                        });
                    } else {
                        new Client.Thread.configureText(session, AccID, "huh?").then(function(t) {
                            Client.logger.log("Sent message!");
                        });
                    }
                }
            }
        } else {
            throw new Error("An id is required. Get one.");
        }
    }, 60 * 1000); // 60 * 1000 milsec
})().catch(e => {
    // Deal with the fact the chain failed
    Client.logger.log(e, "error");
});

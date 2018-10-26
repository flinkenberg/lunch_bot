require("dotenv").config();
const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
// const app = express();
const port = process.env.PORT;

// app.get("/", (req, res) => {
//     console.log(req.headers);
//     return res.send("tets");
// });

let step = 1;
let lastMessage = null;

const fields = [
    "firstname",
    "lastname",
    "wrap",
    "phone",
];

const wraps = [
    "the_big_one",
    "the_hot_boy",
];

const wrapsEnum = {
    "the_big_one": "The Big One",
    "the_hot_boy": "The Hot Boy",
};

async function orderLunch(params) {
    try {
        const res = await fetch("https://cafedomenico-order.now.sh/", {
            method: "POST",
            body: JSON.stringify({
                firstname: params.firstname,
                surname: params.lastname,
                phone: params.phone,
                pickup: "12:30pm",
                sandwich: wrapsEnum[params.wrap],
                bread: "Wrap",
                spread: "-",
                Check_ctr_meat: "on",
                Check_ctr_veg: "-",
                cheese: "-",
                Check_ctr_dress: "-",
                Check_ctr_seas: "-",
                toasted: "-",
                comments: ""
            }),
        });
        if (res.status === 200) {
            const data = await res.json();
            if (data.results && data.results.length) {
                const user = `${data.results[0].name.first} ${data.results[0].name.last}`;
                return user;
            }
        } else {
            throw new Error(res.error);
        }
    } catch(err) {
        console.error(err);
        return err;
    }
}

app.use(bodyParser.urlencoded({ extended: false })).post("/", async (req, res, next) => {
    try {
        let params = req.body.text.split(" ");
        params = params.reduce((acc, p) => {
            if (p.includes(":")) {
                const param = p.split(":");
                if (param.length === 2) {
                    const key = param[0];
                    const value = param[1];
                    if (fields.includes(key)) {
                        if (key === "wrap") {
                            if (!wraps.includes(value)) {
                                console.log(params);
                                throw new Error(`Not a valid wrap. Use one of the following wraps: [${wraps}].`);
                            } else if (key === "firstname" || key === "lastname") {
                                value = value.toUpperCase();
                            }
                        }
                        acc = {
                            ...acc,
                            [key]: value,
                        };
                    } else {
                        console.log(params);
                        throw new Error(`Invalid fields. Use one of the following fields: [${fields}]`);
                    }
                }
            }
            return acc;
        }, {});
        if (params.wrap && params.firstname && params.lastname && params.phone) {
            // const lunch = await orderLunch(params);
            const lunch = params;
            if (lunch) {
                res.json({
                    "response_type": "in_channel",
                    "text": `
                    > :happy_dev: *Hello, here is your order*: :harold:
                        :yvan: *Wrap:* \`\`\`${wrapsEnum[params.wrap]}\`\`\`
                        :i_see: *Name:* \`\`\`${params.firstname.toUpperCase()} ${params.lastname.toUpperCase()}\`\`\`
                        :not_sure: *Phone:* \`\`\`${params.phone}\`\`\`
                    `,
                });
            }
        } else {
            console.log(params);
            throw new Error(`Not all required fields found. Include all of following fields: [wrap,firstname,lastname,phone]`);
        }
    } catch(err) {
        res.send(err.toString());
        next(err);
    }
});

app.use(bodyParser.json()).post("/events", async (req, res) => {
    // res.json({
    //     challenge: req.body.challenge,
    // });
    console.log(req.body);
    if (req.body.event.text) {
        if (req.body.event.type === "app_mention") {
            res.sendStatus(200);
            step = 1;
            const reply = await fetch("https://slack.com/api/chat.postMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
                },
                body: JSON.stringify({
                    text: `Hi, which wrap would you like to order <@${req.body.event.user}>? :happy_dev:`,
                    channel: req.body.event.channel,
                }),
            });
            if (reply.status === 200) {
                step++;
            }
            // const redsadsa = await reply.json();
            // console.log(redsadsa)
        } else if (req.body.event.type === "message" && req.body.event.user) {
            res.sendStatus(200);
            if (step === 2 && wraps.includes(req.body.event.text)) {
                const reply = await fetch("https://slack.com/api/chat.postMessage", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
                    },
                    body: JSON.stringify({
                        text: `Mmm, ${wrapsEnum[req.body.event.text]}, okay. What is your full name? :harold:`,
                        channel: req.body.event.channel,
                    }),
                });
                if (reply.status === 200) {
                    step++;
                }
            } else if (req.body.event.user) {
                res.sendStatus(200);
                const reply = await fetch("https://slack.com/api/chat.postMessage", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.BOT_TOKEN}`,
                    },
                    body: JSON.stringify({
                        text: `Sorry I did not get that... :i_see:`,
                        channel: req.body.event.channel,
                    }),
                });
            }
        }
    }
});

app.listen(port, () => console.log(`server running on port ${port}`));
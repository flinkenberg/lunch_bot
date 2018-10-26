const fetch = require("node-fetch");
const express = require("express");
const bodyParser = require("body-parser");
const app = express().use(bodyParser.urlencoded({ extended: false }));
const port = 6000;

app.get("/", (req, res) => {
    console.log(req.headers);
    return res.send("tets");
});

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

app.post("/", async (req, res, next) => {
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
                            } else {
                                acc = {
                                    ...acc,
                                    [key]: value,
                                };
                            }
                        } else {
                            acc = {
                                ...acc,
                                [key]: value,
                            };
                        }
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
                    > :harold: *Hello, here is your order*:
                        :yvan_no: *Wrap:* \`\`\`${wrapsEnum[params.wrap]}\`\`\`
                        :i_see: *Name:* \`\`\`${params.firstname} ${params.lastname}\`\`\` 
                        :ondrej: *Phone:* \`\`\`${params.phone}\`\`\`
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

app.listen(port, () => console.log(`server running on port ${port}`));
const axios = require("axios");
const translatte = require("translatte");
exports.lambdaHandler = async (event) => {
  if (event.queryStringParameters) {
    // Register the webhook
    const queryParams = event.queryStringParameters;
    const verify_token = process.env.VERIFY_TOKEN;

    // Parse params from the webhook verification request
    let mode = queryParams["hub.mode"];
    let token = queryParams["hub.verify_token"];
    let challenge = queryParams["hub.challenge"];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === "subscribe" && token === verify_token) {
        console.log("WEBHOOK_VERIFIED");
        return {
          statusCode: 200,
          body: challenge,
        };
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        return {
          statusCode: 403,
        };
      }
    }
  } else {
    const token = process.env.WHATSAPP_TOKEN;
    const body = JSON.parse(event.body);
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        let phone_number_id =
          body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        let msg_body = body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        const tanslate = await translatte(msg_body, { to: "en" });
        await axios({
          method: "POST",
          url:
            "https://graph.facebook.com/v12.0/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: tanslate.text },
          },
          headers: { "Content-Type": "application/json" },
        });
        return {
          statusCode: 200,
        };
      }
    }
  }
};

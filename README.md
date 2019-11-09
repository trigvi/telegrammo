
*Developed with Node.js 10 and Express.js 4.16.*

This application is an API with endpoints for creating and managing sub-bots for a main Telegram bot and sending messages to sub-bot subscribers.

I created it because Telegram only allows the creation of 20 bots, but I needed way more to send tailored messages to different users of a betting signals project.

&nbsp;
&nbsp;

# Setup

* Open Telegram, start a conversation with http://t.me/BotFather, create your main Telegram bot, note down its token.

* Also, while in the BotFather chat, set details for your new bot by using `/setdescription`, `/setabouttext`. Also use `/setcommands` to set the following commands for your new bot:
    ```
    subscribe - Subscribe to a sub-bot
    unsubscribe - Unsubscribe from a sub-bot
    subscriptions - View sub-bots you subscribed to
    ```

* Create a Postgres db.

* Clone Git repository, get into repo directory.

* Install dependencies: `npm install`

* Copy `mysettings.template.json` to `mysettings.json`

* Open `mysettings.json` and customise: db settings (`database`), main Telegram bot(s) (`telegramBotsAllowed`), authorisation token(s) for this API (`api.tokens`).

* Set `app.sh` as executable:
    ```
    chmod +x app.sh
    ```

* Set file permissions:
    ```
    sudo chmod 755 -R /path/to/app
    sudo chmod 777 -R /path/to/app/database
    sudo chmod 777 -R /path/to/app/logs
    ```

* The `database` folder is simply used to periodically dump the Postgres db (see crontab below).

* Setup cron schedule, replacing `<PORT>` and `/path/to/app` accordingly. The following would launch our app with `app.sh` every minute, which is a bash script that in turn launches the node app if not already running. This ensures that the app re-starts again automatically if it crashes.
    ```
    0 * * * * pg_dump telegrammo > /path/to/app/database/postgres_backup.bak
    * * * * cd /path/to/app; ./app.sh --port=<PORT> >> ./logs/telegrammo.log
    ```

* Create nginx website configuration, proxying your domain name to (for example) `http://127.0.0.1:<PORT>`.

* When configuring your nginx website, put the following directive inside `location`:
    ```
    proxy_set_header  X-Real-IP  $remote_addr;
    ```

* Make your website HTTPS-only (you could use https://certbot.eff.org/). This is very important because our API authenticates requests using a header token, so requests must be encrypted.

&nbsp;
&nbsp;

# Security

Every request made to our API (excluding `/webhook`) must include the following header with a token you defined in `mysettings.json`.
    ```
    Access-Token: <TOKEN>
    ```

&nbsp;
&nbsp;

# Endpoints

* Create new sub-bot (the API will generate a unique `subbotIdentifier` for the new sub-bot and include it in the response):
    ```
    POST https://<YOURDOMAIN>/api/v1.0/subbot
    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "description": "Some description for the new sub-bot"
    }
    ```

* Send message to all Telegram subscribers of a sub-bot:
    ```
    POST https://<YOURDOMAIN>/api/v1.0/outgoing
    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "subbotIdentifier": "<SUBBOT_IDENTIFIER>",
        "text": "Your message text"
    }
    ```

* Delete a sub-bot:
    ```
    DELETE https://<YOURDOMAIN>/api/v1.0/subbot
    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "subbotIdentifier": "<SUBBOT_IDENTIFIER>"
    }
    ```

* Webhook URL to receive Telegram interactions:
    ```
    POST https://<YOURDOMAIN>/api/v1.0/webhook/<TELEGRAM_MAIN_BOT_USERNAME>
    ```

&nbsp;
&nbsp;

# Setup Telegram Webhook URL

Once you created the Telegram main bot and our API is up and running, we need our API to receive notifications from Telegram any time a user interacts with our main bot.

For this to happen, we must tell Telegram our API's webhook URL for our main bot. We can do so by sending Telegram a POST request:

```
curl -i   --header "Content-Type: application/json"   --request POST  https://api.telegram.org/bot<TELEGRAM_MAIN_BOT_TOKEN>/setWebhook    --data '{"url":"<WEBHOOK_URL>", "allowed_updates": ["message", "channel_post"]}'
```


# Telegram user interactions with our sub-bots

Our sub-bots support two actions: subscribing and unsubscribing to a sub-bot.

Typically, a user on the Telegram app should:

* Know our Telegram main bot username

* Know the sub-bot identifier

* Start a chat with our Telegram main bot (or add it as Admin to his channel)

* Send the following message to subscribe to a sub-bot:
    ```
    @<TELEGRAM_MAIN_BOT_USERNAME>  /subscribe  <SUBBOT_IDENTIFIER>
    ```

* Send the following message to unsubscribe to a sub-bot:
    ```
    @<TELEGRAM_MAIN_BOT_USERNAME>  /unsubscribe  <SUBBOT_IDENTIFIER>
    ```

* View which sub-bots he has subscribed to:
    ```
    @<TELEGRAM_MAIN_BOT_USERNAME>  /subscriptions
    ```

* Once he has subscribed to one of our sub-bots, he will receive a message whenever we hit our API endpoint to send a message to all subscribers of that sub-bot.

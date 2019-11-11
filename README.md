
This application is an API for creating and managing sub-bots for a main Telegram bot. Here's how it works:

* Create a main bot directly on the Telegram app.
* Add main bot settings to this API.
* Tell Telegram this API's webhook URL for your main bot.
* Use this API to define sub-bots.
* Sub-bots (and their subscribers) get stored in this API's db.
* Telegram users will be able to subscribe to a sub-bot.
* Use this API to send messages to all subscribers of a sub-bot.

*Developed with: Nodejs 10, Postgres 9.6, Debian 9*

&nbsp;
&nbsp;

# Setup

* Open Telegram, start a conversation with http://t.me/BotFather, create your main Telegram bot, note down its token.

* Also, while in the BotFather chat, set details for your new bot by using `/setdescription`, `/setabouttext`. Also use `/setcommands` and send the following text:
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

* Set file permissions:
    ```
    sudo chmod 755 -R /path/to/app
    sudo chmod 777 -R /path/to/app/database
    sudo chmod 777 -R /path/to/app/logs
    sudo chmod +x /path/to/app/app.sh
    ```

* The `database` folder is simply used to periodically dump the Postgres db (see crontab below).

* Setup cron schedule, replacing `<PORT>` and `/path/to/app` accordingly. The following would launch `app.sh` every minute, which is a bash script that in turn launches the node app if not already running. This ensures that the app re-starts again automatically if it crashes.
    ```
    0 * * * * pg_dump telegrammo > /path/to/app/database/postgres_backup.bak
    * * * * cd /path/to/app; ./app.sh --port=<PORT> >> ./logs/telegrammo.log
    ```

* Create nginx website configuration, proxying your domain name to `http://127.0.0.1:<PORT>`.

* When configuring your nginx website, put the following directive inside `location`. It let's this API know the request's IP address so that it can whitelist Telegram IPs on the `/webhook` endpoint.
    ```
    proxy_set_header  X-Real-IP  $remote_addr;
    ```

* Make your website HTTPS-only (you could use https://certbot.eff.org/). This is very important because this API authenticates requests using a header token, so requests must be encrypted.

&nbsp;
&nbsp;

# Setup Telegram Webhook

Once this API is up and running, we need it to receive notifications from Telegram whenever a user interacts with our main bot.

For this to happen, we must tell Telegram this API's webhook URL for the main bot (see Endpoints section below), by sending Telegram a POST request:

```
curl -i   --header "Content-Type: application/json"   --request POST  https://api.telegram.org/bot<TELEGRAM_MAIN_BOT_TOKEN>/setWebhook    --data '{"url":"<WEBHOOK_URL>", "allowed_updates": ["message", "channel_post"]}'
```

&nbsp;
&nbsp;

# Endpoints

* Create sub-bot (the response will contain its unique `subbotIdentifier`):
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

# Security

* Every request made to this API must include the following header.
    ```
    Access-Token: <TOKEN>
    ```

* You can define tokens in `mysettings.json`.

* The only endpoint that doesn't require a token is `/webhook`, as we can't control what Telegram sends us.

&nbsp;
&nbsp;

# Telegram Commands

Typically, a user on the Telegram app will:

* Know the Telegram main bot username (you tell him).

* Know the sub-bot identifier (you tell him).

* Start a chat with the Telegram main bot (or add it as an admin to his channel).

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

* Once he has subscribed to a sub-bot, he will receive all messages we send to that sub-bot's subscribers through this API.

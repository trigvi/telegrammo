
Nodejs API app for managing sub-bots of a Telegram bot.

*Developed with: Nodejs 10, Postgres 9.6, Debian 9*

&nbsp;
&nbsp;

# In A Nutshell

Telegram let's you only create 20 bots.

This API let's you work around that, by allowing the creation and management of unlimited sub-bots for one Telegram bot. Sub-bot details and subscribers are stored in your own db. Here's how it works in a nutshell:

* Create a main bot directly on the Telegram app.
* Add main bot settings to this API's configuration file.
* Setup and run this API.
* Tell Telegram this API's webhook URL for your main bot.
* Use this API to define sub-bots.
* Telegram users will be able to subscribe to a sub-bot.
* Use this API to send messages to all subscribers of a sub-bot.

&nbsp;
&nbsp;

# Setup

* Open Telegram, start a conversation with http://t.me/BotFather, create your main Telegram bot, note down its token.

* While in the BotFather chat, set description (`/setdescription`) and about text (`/setabouttext`) for your new bot. Then use `/setcommands` and send the following text:
    ```
    subscribe - Subscribe to a sub-bot
    unsubscribe - Unsubscribe from a sub-bot
    subscriptions - View sub-bots you subscribed to
    ```

* Create Postgres database `telegrammo` and user `telegrammo`:
    ```
    CREATE DATABASE telegrammo;
    CREATE USER telegrammo WITH PASSWORD 'telegrammo';
    GRANT ALL PRIVILEGES ON DATABASE "telegrammo" TO telegrammo;
    ```

* Before cloning the repo, create dedicated Linux user `telegrammo`:
    ```
    sudo adduser --shell /bin/bash --gecos "User" --home /home/telegrammo telegrammo
    ```

* Switch to user `telegrammo` and clone this git repo:
    ```
    sudo su - telegrammo
    git clone <REPO_URL> repository
    ```

* Install dependencies:
    ```
    cd repository
    npm install
    ```

* Make application executable:
    ```
    chmod +x app.sh
    ```

* Create settings file by copying template:
    ```
    cp mysettings.json.template mysettings.json
    ```

* Open `mysettings.json` and customise accordingly. In `api.tokens` you can define valid authentication tokens for this API. In `telegramBotsAllowed` you can define your main Telegram bot(s).

* Logout from user `telegrammo`:
    ```
    exit
    ```

* Setup cron schedule. The following will make this API run on port 8083. By the way, `app.sh` gets triggered every minute and it starts the actual node app if not already running. This ensures that this API re-starts again automatically after a crash.
    ```
    sudo /etc/crontab
    ```

    ```
    0 * * * *   telegrammo   pg_dump telegrammo > /home/telegrammo/repository/database/postgres_backup.bak
    * * * * *   telegrammo   cd /home/telegrammo/repository; ./app.sh --port=8083 >> ./logs/telegrammo.log
    ```

* Create nginx website configuration, proxying your domain name to `http://127.0.0.1:8083`. When creating nginx conf file, put the following inside `location` so that this API can know the visitor's IP and whitelist Telegram's.
    ```
    proxy_set_header  X-Real-IP  $remote_addr;
    ```

* Make your website HTTPS-only (you could use https://certbot.eff.org/). This is essential because this API authenticates requests using a header token.

&nbsp;
&nbsp;

# Setup Telegram Webhook

Once this API is up and running, we need it to receive notifications from Telegram whenever a user interacts with our main bot.

For this to happen, we must tell Telegram this API's `<WEBHOOK_URL>` for the main bot (see Endpoints section below) by sending Telegram a POST request:

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


Telegram let's you only create 20 bots.

This Nodejs API, hosted on your server, allows the creation and management (in your db) of unlimited sub-bots.

*Developed with: Nodejs 12, Postgres 11, Debian 10*

&nbsp;
&nbsp;

# In A Nutshell

* Create main bot on the Telegram app.
* Add main bot token to this API's config.
* Run this API on your server.
* Tell Telegram the webhook URL for the main bot.
* User starts a chat with the main bot on Telegram.
* User sends the main bot a "subscribe to sub-bot" message.
* Telegram hits webhook URL on this API when the above happens.
* This API then keeps track of which users subscribed to which sub-bot.
* Hit this API's `/outgoing` endpoint to send a message to all subscribers of a sub-bot.

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

* Create Postgres database `telegrammo` and user `telegrammo`, for example:
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
    cd repository
    git config core.filemode false
    ```

* Install dependencies:
    ```
    yarn
    ```

* Make application executable:
    ```
    chmod u+x telegrammo.sh
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

* Setup cron schedule. The following will make this API run on port 50002. By the way, `telegrammo.sh` gets triggered every minute and it starts the actual node app if not already running. This ensures that this API re-starts again automatically after a crash.
    ```
    sudo /etc/crontab
    ```

    ```
    0 0 * * *   telegrammo   pg_dump telegrammo > /home/telegrammo/repository/database/postgres_backup.bak
    * * * * *   telegrammo   cd /home/telegrammo/repository; ./telegrammo.sh --port=50002 >> ./logs/telegrammo.log
    ```

* Create nginx website configuration, proxying your domain name to `http://127.0.0.1:50002`. When creating nginx conf file, put the following inside `location` so that this API can know the visitor's IP and whitelist Telegram's.
    ```
    proxy_set_header  X-Real-IP  $remote_addr;
    ```

* Make your website HTTPS-only (you could use https://certbot.eff.org/). This is essential because this API authenticates requests using a header token.

&nbsp;
&nbsp;

# Set Telegram Webhook

Once this API is up and running, we need to tell Telegram this API's webhook url so that Telegram can send notifications when users interact with our bots.

To do so, send a POST request to this API's `/webhook-set` endpoint as shown below.

&nbsp;
&nbsp;

# Endpoints

Please note that you can test all the following endpoints manually with your browser by visiting:
    ```
    https://<YOURDOMAIN>/manually?accessToken=<TOKEN>
    ```

* Tells Telegram our webhook url for a main bot:
    ```
    POST https://<YOURDOMAIN>/api/v1.0/webhook-set

    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>"
    }
    ```

* Creates sub-bot (the response will contain its unique `subbotIdentifier`):
    ```
    POST https://<YOURDOMAIN>/api/v1.0/subbot

    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "description": "Some description for the new sub-bot"
    }
    ```

* Sends message to all Telegram subscribers of a sub-bot:
    ```
    POST https://<YOURDOMAIN>/api/v1.0/outgoing

    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "subbotIdentifier": "<SUBBOT_IDENTIFIER>",
        "text": "Your message text"
    }
    ```

* Deletes sub-bot:
    ```
    DELETE https://<YOURDOMAIN>/api/v1.0/subbot

    {
        "tgBotUsername": "<TELEGRAM_MAIN_BOT_USERNAME>",
        "subbotIdentifier": "<SUBBOT_IDENTIFIER>"
    }
    ```

&nbsp;
&nbsp;

# Security

* Every request made to this API must send a valid token either through HTTP header `Access-Token` or query string `accessToken`.

* You can define valid tokens in `mysettings.json`.

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

# FlashlightBot
Yet another osu! match costs bot

# Requirements
- Node.js (versions 8 and up)

# How to use
* Clone this repo to your current folder:

    ```bash
    git clone https://github.com/LeoFLT/FlashlightBot
    ```

* cd into the folder:

    ```bash
    cd ./FlashlightBot`
    ```

* create a .env file:
    ```bash
    touch .env
    vim .env
    ```
    * In the newly created file, add the following KEY=VALUE pairs
        ```bash
        DISCORD_TOKEN=YOUR.DISCORD_TOKEN
        OSU_API_KEY=YOUR.OSU_API_KEY
        OWNER=YOUR.DISCORD_USER_ID
        PREFIX=YOUR.CHOSEN.PREFIX
        ```
        some things to note:
        * the KEY=VALUE pairs must not contain spaces
        * the prefix length must not exceed two characters
    
* Install dependencies:

    ```bash
    npm install
    ```

* Start the server:

    ```bash
    node index.js
    ```

The default prefix is `$` (command to change it on the fly pending).
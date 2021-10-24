# **Chatz**
#### _Mini web chat script for Tampermonkey (or your site)_

## Preparing
 Create a new Tampermonkey script with the code from **script.js**. Then run the **server.js** if you don't have a permanent and run _Ngrok_ HTTP on port **9000**. Then you can use the chat.

## Setting up
 Visit any site. You will be asked if you want to continue with the chat. Click _OK_ if you do. Then enter any _nick_, _room ID_ to connect and its _password_ in format **_NICK@ROOMID:PASS_**. If the room doesn't exist, it will be created automatically. If you've entered incorrect password, you won't be able to send/receive messages. _Nick_ must be _at least_ **4** numbers/letters, _room ID_ - exactly **6** numbers, _password_ - exactly **4** numbers.
 Click OK and enter Websocket server URL without protocols. Click OK and agree if it's correct. Then you can use the chat.
 Note: if you were asked again, click Cancel. Or set **_\@match_** variable in the Tampermonkey script to the URL you're gonna visit, including protocol.

## Usage
 You can _drag and drop_ the chat. If you've dropped it outside your browser viewport, press **[=]** key _(equal)_ on your keyboard. You can send and receive messages. If you can't focus the message text box or send a message, try pressing **[~]** key _(tilda/backquote)_ on your keyboard.

## Other settings
 If your chat is too big/small, you can change the size multiplier in the **script.js**.
 If you have a permanent Websocket server, you can set it in the script. Then you should set the variable below to _true_

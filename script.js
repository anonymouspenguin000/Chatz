// ==UserScript==
// @name         Chatz
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Tampermonkey script for mini web chat
// @author       Rubix
// @match        *://*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (!confirm('========= CHATZ =========\nDo you want to setup the chat?')) return;

    // ============ Setting up common variables ============ //
    let unitMultiplier = 1; // <== SET SIZE MULTIPLIER IF YOUR WINDOW IS TOO BIG/SMALL
    let address = 'localhost:9000'; /* <= SET A PERMANENT ADDRESS IF YOU HAVE
                                          (WITHOUT PROTOCOLS), THEN CHANGE THE VARIABLE
                                          BELOW TO TRUE. IT'S NOT TO ENTER THE WS SERVER
                                          ADDRESS EVERY NEW SESSION */
    let permanent = false;

    let ws;
    let user = '';
    let roomID = '';
    let password = '';
    let data;
    let data2 = address;
    let re = /\w\w\w\w+@\d\d\d\d\d\d:\d\d\d\d/;
    while (true) {
      data = prompt('==== CHATZ SETUP ====\nEnter your nick (At least 4 any numbers/letters), roomID (6 numbers) and password to the room (4 numbers) in format NICK@ROOMID:PASS\nIf the room with entered ID doesn\'t exist, it will be created automatically.\nAny nick, but try *not* to make it similar.')
            .trim();
      if (data == null) return;
      if (data != '' && data.replace(re, '') == '') break; // how can I do the statement better?
      alert('INCORRECT STRING FORMAT');
    }
    while (true && !permanent) {
      data2 = prompt('==== CHATZ SETUP ====\nSet your WebSocket server address (WITHOUT http:// or other protocols):');
      if (confirm(data2 + '\nAre you sure?')) break;
    }
    address = 'ws://' + data2;
    [user, roomID] = data.split('@');
    [roomID, password] = roomID.split(':');
    alert('Press [~] if you have troubles with sending messages.\nPress [=] if you\'ve dropped the chat outside your browser viewport.');

    // ===================================================== //

    // ============ Setting up the chat's outer view and behavior ============ //
    /* == CHAT DOM STRUCTURE ==
    *
    * BODY
    * |  NAME
    * |  MESSAGES
    * | |  MSG_STRING
    * | |  MSG_STRING
    * | |_ ...
    * |  BOTTOM_PANEL
    * | |  TEXTBOX
    * | |_ SEND_BUTTON
    * |_
    *
    */

    // CREATING ELEMENTS
    let body = document.createElement('div');
    let name = document.createElement('h4');
    let messages = document.createElement('div');
    let bottompanel = document.createElement('div');
    let textbox = document.createElement('input');
    let sendbtn = document.createElement('button');

    // STYLES
    body.style = `
      background-color: #fff;
      border-radius: ${10 * unitMultiplier}px;
      border: solid #000 ${1 * unitMultiplier}px;
      position: fixed;
      width: ${250 * unitMultiplier}px;
      height: ${200 * unitMultiplier}px;
      z-index: 999;
      opacity: 0.5;
      cursor: move;
      font-family: Arial;
      color: #000;
    `;
    name.style = `
      text-align: center;
      margin: ${5 * unitMultiplier}px 0;
      font-size: ${15 * unitMultiplier}px;
    `;
    messages.style = `
      height: 65%;
      width: 95%;
      margin: auto auto;
      border: solid black 1px;
      overflow-y: scroll;
      overflow-wrap: break-word;
    `;
    bottompanel.style = `
      width: 95%;
      height: 10%;
      margin: 5px auto;
    `;
    textbox.style = `
      height: 100%;
      width: 80%;
      margin:0;
    `;
    sendbtn.style = `
      height: 110%;
      margin:0;
    `;

    // LABELS
    name.innerHTML = 'Chatz #' + roomID;
    textbox.placeholder = 'Message...';
    sendbtn.innerHTML = '==>';

    // EVENTS
    body.onmouseover = () => { body.style.opacity = 1 };
    body.onmouseleave = () => { body.style.opacity = 0.4 };
    textbox.onkeydown = evt => { if (evt.code == 'Enter') sendbtn.onclick() };
    sendbtn.onclick = () => {
      if (textbox.value.trim() == '') {
        textbox.value = '';
        return;
      }
      send('send^BREAKER;' + user + '^BREAKER;' + textbox.value);
      textbox.value = '';
    }
    window.addEventListener('keydown', evt => {
      if (evt.code == 'Backquote') {
        textbox.value = prompt('Alternative textbox\nMessage:', textbox.value) || '';
        if (textbox.value != '') sendbtn.click();
      }
      if (evt.code == 'Equal') {
        body.style.left = 0;
        body.style.top = 0;
      }
    });

    // FUNCTIONS
    function writeLine(sender, text, style1, style2) {
      let elem = document.createElement('div');
      elem.innerHTML = `<span style="${style1}">${sender}:</span> <span style="${style2}">${text}</span>`;
      messages.append(elem);
      messages.scrollTo(0, messages.scrollHeight);
    }
    function receive() {
      body.style.border = 'solid red 5px';
      function _leave() {
        body.style.border = 'solid black 1px'
        body.removeEventListener('mouseleave', _leave);
      }
      body.addEventListener('mouseleave', _leave);
    }

    // BUILDING THE CHAT
    body.append(name);
    body.append(messages);
    body.append(bottompanel);
    bottompanel.append(textbox);
    bottompanel.append(sendbtn);
    document.body.prepend(body);
    // ======================================================================= //

    // ============ Drag-N-Drop ============ //
    body.addEventListener('mousedown', mousedown);
    function mousedown (evt) {
      window.addEventListener('mousemove', mousemove);
      window.addEventListener('mouseup', mouseup);
      let prevX = evt.clientX;
      let prevY = evt.clientY;
      function mousemove (evt) {
        let newX = prevX - evt.clientX;
        let newY = prevY - evt.clientY;
        let rect = body.getBoundingClientRect();
        body.style.left = rect.left - newX + 'px';
        body.style.top = rect.top - newY + 'px';
        prevX = evt.clientX;
        prevY = evt.clientY;
      }
      function mouseup () {
        window.removeEventListener('mousemove', mousemove);
        window.removeEventListener('mouseup', mouseup);
      }
    }
    // ===================================== //

    // ============ Working with Backend ============ //
    connect();
    function connect() {
      ws = new WebSocket(address);
      ws.onopen = () => { send(`open^BREAKER;${roomID}^BREAKER;${user}^BREAKER;${password}`) };
      ws.onmessage = evt => {
        if (evt.data == 'ping') {
          send('pong');
          return;
        };
        let data = evt.data.split('^BREAKER;');
        writeLine(data[0], data[1], data[2], data[3]);
        receive();
      }
      ws.onerror = evt => {
        writeLine('Server', evt.message || 'ERROR', 'font-weight: bold; color: blue', 'font-weight: bold; font-style: italic; color:red');
        receive();
      }
      ws.onclose = () => {
        writeLine('Server', 'Connection closed by Server', 'font-weight: bold;color:blue;', 'font-style: italic;');
        receive();
      }
    }
    function send(msg) {
      ws.send(msg);
    }
    // ============================================== //
})();

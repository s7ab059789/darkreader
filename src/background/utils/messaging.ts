/**
 * This is a 
 */

import type {DocumentInfo, ExtensionData, Message, TabInfo} from '../../definitions';
import {DocumentState, DocumentId} from '../../utils/document';

import {MessageType} from '../../utils/message';
import {isPanel} from './../utils/tab';

declare const __CHROMIUM_MV2__: boolean;

// This function exists to prevent Chrome from logging an error about
// closed conduit. It just sends a dummy message in response to incomming message
// to utilise open conduit. This response message is not even used on the other side.
function makeChromiumHappy(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: {type: '¯\\_(ツ)_/¯'}) => void) {
    if (![
        // Messenger
        MessageType.UI_GET_DATA,
        MessageType.UI_APPLY_DEV_DYNAMIC_THEME_FIXES,
        MessageType.UI_APPLY_DEV_INVERSION_FIXES,
        MessageType.UI_APPLY_DEV_STATIC_THEMES,
    ].includes(message.type) &&
        (message.type !== MessageType.CS_FRAME_CONNECT || !isPanel(sender))) {
        sendResponse({type: '¯\\_(ツ)_/¯'});
    }
}


type messageListenerResponse = {data?: ExtensionData | TabInfo; error?: string} | {type: '¯\\_(ツ)_/¯'} |   'unsupportedSender';
// Note: return value true indicates that sendResponse() will be called asynchroneously
type messageListenerCallback = (message: Message, sender: DocumentInfo, sendResponse: (response: messageListenerResponse) => void) => true | void | Promise<void>;

export default class RuntimeMessage {
    private static listeners: messageListenerCallback[];
    private static switchboard: {[documentId: DocumentId]: DocumentInfo} = {};

    static sendMessage(message: Message) {
        // TODO
        chrome.runtime.sendMessage<Message>(message);
    }

    static sendDocumentMessage(documentId: DocumentId, message: Message) {
        if (RuntimeMessage.switchboard[documentId]) {
            const address = RuntimeMessage.switchboard[documentId];
            chrome.tabs.sendMessage<Message>(address.tabId, message, {frameId: address.frameId});
        }
    }

    static addListener(callback: messageListenerCallback) {
        if (!RuntimeMessage.listeners) {
            RuntimeMessage.listeners = [callback];
            if (__CHROMIUM_MV2__) {
                RuntimeMessage.listeners.push(makeChromiumHappy);
            }
            chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => RuntimeMessage.singleListener(message, sender, sendResponse));
        } else {
            RuntimeMessage.listeners.push(callback);
        }
    }

    private static singleListener(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: messageListenerResponse) => void) {
        const info: DocumentInfo = {
            tabId: sender.tab.id,
            frameId: sender.frameId,
            documentId: (sender as any).documentId,
            timestamp: 0,
            state: DocumentState.ACTIVE,
            url: sender.url,
            darkThemeDetected: null,
        };
        for (let i = 0; i < RuntimeMessage.listeners.length; i++) {
            if (RuntimeMessage.listeners[i](message, info, sendResponse) === true) {
                return true;
            }
        }
        return false;
    }
}
